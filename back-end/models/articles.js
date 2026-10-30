import { db } from "../db.js"

function ratingExpr() {
    return `((COALESCE(la.cnt, 0) * 0.7 + COALESCE(cc.cnt, 0))
             / (1 + LN(1 + EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 86400.0 * 0.1)))`
}

async function modGetArticles({ search, tag, sortBy, page, pageSize, username }) {
    try {
        const params = []
        const conditions = []

        if (username) {
            params.push(username)
            conditions.push(`u.name = $${params.length}`)
        }
        if (search) {
            params.push(`%${search}%`)
            conditions.push(`(a.title ILIKE $${params.length} OR a.content ILIKE $${params.length})`)
        }
        if (tag) {
            params.push(tag)
            conditions.push(`EXISTS (
                SELECT 1 FROM article_tags at2
                JOIN tags t2 ON t2.id = at2.tag_id
                WHERE at2.article_id = a.id AND t2.title = $${params.length}
            )`)
        }

        const where = conditions.length ? "WHERE " + conditions.join(" AND ") : ""

        let orderBy = "a.created_at DESC"
        if (sortBy === "popular") orderBy = `${ratingExpr()} DESC`
        else if (sortBy === "featured") orderBy = "COALESCE(la.cnt, 0) DESC, a.created_at DESC"

        const offset = (page - 1) * pageSize
        params.push(pageSize, offset)

        const sql = `
            SELECT
                a.id, a.title, a.content, a.image_url, a.view_count,
                a.created_at, a.updated_at,
                u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar,
                COALESCE(la.cnt, 0)::int AS likes_count,
                COALESCE(cc.cnt, 0)::int AS comments_count,
                COALESCE(tg.tags, '[]'::json) AS tags
            FROM articles a
            JOIN users u ON u.id = a.user_id
            LEFT JOIN (SELECT article_id, COUNT(*) AS cnt FROM like_articles GROUP BY article_id) la ON la.article_id = a.id
            LEFT JOIN (SELECT article_id, COUNT(*) AS cnt FROM comments GROUP BY article_id) cc ON cc.article_id = a.id
            LEFT JOIN (
                SELECT at.article_id, json_agg(t.title ORDER BY t.title) AS tags
                FROM article_tags at
                JOIN tags t ON t.id = at.tag_id
                GROUP BY at.article_id
            ) tg ON tg.article_id = a.id
            ${where}
            ORDER BY ${orderBy}
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `

        const countSql = `
            SELECT COUNT(*)::int AS total
            FROM articles a JOIN users u ON u.id = a.user_id
            ${where}
        `

        const result = await db.query(sql, params)
        const countResult = await db.query(countSql, params.slice(0, -2))

        const articles = result.rows.map(r => ({
            id: r.id,
            title: r.title,
            content: r.content,
            image: r.image_url,
            viewCount: r.view_count,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            author: {
                id: r.author_id,
                userName: r.author_name,
                avatar: r.author_avatar,
                avatarUrl: r.author_avatar
            },
            tags: r.tags,
            likesCount: r.likes_count,
            commentsCount: r.comments_count
        }))

        return { answer: "true", info: { articles, totalCount: countResult.rows[0].total } }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении статей" }
    }
}

async function modGetFeed(userId, page, pageSize) {
    try {
        const subs = await db.query(
            "SELECT target_user_id FROM subscriptions WHERE subscriber_id = $1",
            [userId]
        )
        const ids = subs.rows.map(r => r.target_user_id)
        if (ids.length === 0) return { answer: "true", info: { articles: [], totalCount: 0 } }

        const offset = (page - 1) * pageSize
        const result = await db.query(`
            SELECT
                a.id, a.title, a.content, a.image_url, a.view_count,
                a.created_at, a.updated_at,
                u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar,
                COALESCE(la.cnt, 0)::int AS likes_count,
                COALESCE(cc.cnt, 0)::int AS comments_count,
                COALESCE(tg.tags, '[]'::json) AS tags,
                EXISTS (SELECT 1 FROM like_articles WHERE article_id = a.id AND user_id = $1) AS is_liked
            FROM articles a
            JOIN users u ON u.id = a.user_id
            LEFT JOIN (SELECT article_id, COUNT(*) AS cnt FROM like_articles GROUP BY article_id) la ON la.article_id = a.id
            LEFT JOIN (SELECT article_id, COUNT(*) AS cnt FROM comments GROUP BY article_id) cc ON cc.article_id = a.id
            LEFT JOIN (
                SELECT at.article_id, json_agg(t.title ORDER BY t.title) AS tags
                FROM article_tags at JOIN tags t ON t.id = at.tag_id
                GROUP BY at.article_id
            ) tg ON tg.article_id = a.id
            WHERE a.user_id = ANY($2::int[])
            ORDER BY a.created_at DESC
            LIMIT $3 OFFSET $4
        `, [userId, ids, pageSize, offset])

        const count = await db.query(
            "SELECT COUNT(*)::int AS total FROM articles WHERE user_id = ANY($1::int[])",
            [ids]
        )

        const articles = result.rows.map(r => ({
            id: r.id,
            title: r.title,
            content: r.content,
            image: r.image_url,
            viewCount: r.view_count,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            author: { id: r.author_id, userName: r.author_name, avatar: r.author_avatar, avatarUrl: r.author_avatar },
            tags: r.tags,
            likesCount: r.likes_count,
            commentsCount: r.comments_count,
            isLiked: r.is_liked
        }))

        return { answer: "true", info: { articles, totalCount: count.rows[0].total } }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении ленты" }
    }
}

async function modGetArticleById(id, currentUserId) {
    try {
        const articleResult = await db.query("SELECT * FROM articles WHERE id = $1", [id])
        if (articleResult.rows.length === 0) return { answer: "false", info: "Статья не найдена" }

        const a = articleResult.rows[0]

        if (!currentUserId || currentUserId !== a.user_id) {
            await db.query("UPDATE articles SET view_count = view_count + 1 WHERE id = $1", [id])
            a.view_count++
        }

        const author = (await db.query("SELECT id, name, avatar_url FROM users WHERE id = $1", [a.user_id])).rows[0]

        const tags = await db.query(`
            SELECT t.title FROM article_tags at
            JOIN tags t ON t.id = at.tag_id
            WHERE at.article_id = $1 ORDER BY t.title
        `, [id])

        const comments = await db.query(`
            SELECT c.id, c.content, c.created_at,
                   u.id AS author_id, u.name AS author_name, u.avatar_url AS author_avatar
            FROM comments c JOIN users u ON u.id = c.user_id
            WHERE c.article_id = $1 ORDER BY c.created_at DESC
        `, [id])

        const likesCount = (await db.query(
            "SELECT COUNT(*)::int AS cnt FROM like_articles WHERE article_id = $1", [id]
        )).rows[0].cnt

        let isLiked = false
        if (currentUserId) {
            const liked = await db.query(
                "SELECT 1 FROM like_articles WHERE article_id = $1 AND user_id = $2",
                [id, currentUserId]
            )
            isLiked = liked.rows.length > 0
        }

        return {
            answer: "true",
            info: {
                id: a.id, title: a.title, content: a.content, image: a.image_url,
                viewCount: a.view_count, createdAt: a.created_at, updatedAt: a.updated_at,
                author: { id: author.id, userName: author.name, avatar: author.avatar_url, avatarUrl: author.avatar_url },
                tags: tags.rows.map(r => r.title),
                likesCount,
                commentsCount: comments.rows.length,
                isLiked,
                comments: comments.rows.map(c => ({
                    id: c.id, content: c.content, createdAt: c.created_at,
                    author: { id: c.author_id, userName: c.author_name, avatar: c.author_avatar }
                }))
            }
        }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении статьи" }
    }
}

async function attachTags(articleId, tags) {
    await db.query("DELETE FROM article_tags WHERE article_id = $1", [articleId])
    if (!tags || tags.length === 0) return
    for (const rawName of tags) {
        const tagName = String(rawName).trim().toLowerCase()
        if (!tagName) continue
        let tagResult = await db.query("SELECT id FROM tags WHERE title = $1", [tagName])
        let tagId
        if (tagResult.rows.length === 0) {
            tagId = (await db.query("INSERT INTO tags (title) VALUES ($1) RETURNING id", [tagName])).rows[0].id
        } else {
            tagId = tagResult.rows[0].id
        }
        await db.query(
            "INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [articleId, tagId]
        )
    }
}

async function modCreateArticle(userId, title, content, tags) {
    try {
        const inserted = await db.query(
            "INSERT INTO articles (title, content, user_id) VALUES ($1, $2, $3) RETURNING id",
            [title, content, userId]
        )
        const articleId = inserted.rows[0].id
        await attachTags(articleId, tags)
        return { answer: "true", info: articleId }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при создании статьи" }
    }
}

async function modUpdateArticle(articleId, userId, title, content, tags) {
    try {
        const check = await db.query("SELECT user_id FROM articles WHERE id = $1", [articleId])
        if (check.rows.length === 0) return { answer: "false", info: "Статья не найдена", code: 404 }
        if (check.rows[0].user_id !== userId) return { answer: "false", info: "Нет доступа", code: 403 }

        await db.query(
            "UPDATE articles SET title = $1, content = $2, updated_at = NOW() WHERE id = $3",
            [title, content, articleId]
        )
        await attachTags(articleId, tags)
        return { answer: "true", info: "Статья обновлена" }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при обновлении статьи" }
    }
}

async function modDeleteArticle(articleId, userId) {
    try {
        const check = await db.query("SELECT user_id FROM articles WHERE id = $1", [articleId])
        if (check.rows.length === 0) return { answer: "false", info: "Статья не найдена", code: 404 }
        if (check.rows[0].user_id !== userId) return { answer: "false", info: "Нет доступа", code: 403 }
        await db.query("DELETE FROM articles WHERE id = $1", [articleId])
        return { answer: "true", info: "Статья успешно удалена" }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при удалении статьи" }
    }
}

async function modLikeArticle(articleId, userId) {
    try {
        const existing = await db.query(
            "SELECT 1 FROM like_articles WHERE article_id = $1 AND user_id = $2",
            [articleId, userId]
        )
        if (existing.rows.length > 0) return { answer: "false", info: "Вы уже лайкнули эту статью", code: 400 }

        await db.query("INSERT INTO like_articles (article_id, user_id) VALUES ($1, $2)", [articleId, userId])
        const cnt = (await db.query(
            "SELECT COUNT(*)::int AS cnt FROM like_articles WHERE article_id = $1", [articleId]
        )).rows[0].cnt
        return { answer: "true", info: cnt }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при лайке" }
    }
}

async function modUnlikeArticle(articleId, userId) {
    try {
        const existing = await db.query(
            "SELECT 1 FROM like_articles WHERE article_id = $1 AND user_id = $2",
            [articleId, userId]
        )
        if (existing.rows.length === 0) return { answer: "false", info: "Вы ещё не лайкнули эту статью", code: 400 }

        await db.query("DELETE FROM like_articles WHERE article_id = $1 AND user_id = $2", [articleId, userId])
        const cnt = (await db.query(
            "SELECT COUNT(*)::int AS cnt FROM like_articles WHERE article_id = $1", [articleId]
        )).rows[0].cnt
        return { answer: "true", info: cnt }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при удалении лайка" }
    }
}

async function modGetArticleImageUrl(articleId) {
    const r = await db.query("SELECT image_url, user_id FROM articles WHERE id = $1", [articleId])
    return r.rows[0]
}

async function modSetArticleImage(articleId, fileUrl) {
    await db.query("UPDATE articles SET image_url = $1, updated_at = NOW() WHERE id = $2", [fileUrl, articleId])
}

async function modClearArticleImage(articleId) {
    await db.query("UPDATE articles SET image_url = NULL, updated_at = NOW() WHERE id = $1", [articleId])
}

export {
    modGetArticles, modGetFeed, modGetArticleById,
    modCreateArticle, modUpdateArticle, modDeleteArticle,
    modLikeArticle, modUnlikeArticle,
    modGetArticleImageUrl, modSetArticleImage, modClearArticleImage
}