import { db } from "../db.js"

async function modCreateComment(userId, articleId, content) {
    try {
        if (!content || !content.trim()) {
            return { answer: "false", info: "Комментарий не может быть пустым", code: 400 }
        }
        const article = await db.query("SELECT id FROM articles WHERE id = $1", [articleId])
        if (article.rows.length === 0) {
            return { answer: "false", info: "Статья не найдена", code: 404 }
        }
        const inserted = await db.query(
            "INSERT INTO comments (content, user_id, article_id) VALUES ($1, $2, $3) RETURNING id, created_at",
            [content.trim(), userId, articleId]
        )
        const user = await db.query("SELECT id, name, avatar_url FROM users WHERE id = $1", [userId])
        const comment = {
            id: inserted.rows[0].id,
            content: content.trim(),
            createdAt: inserted.rows[0].created_at,
            author: {
                id: user.rows[0].id,
                userName: user.rows[0].name,
                avatar: user.rows[0].avatar_url
            }
        }
        return { answer: "true", info: comment }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при создании комментария" }
    }
}

async function modDeleteComment(commentId, userId) {
    try {
        const check = await db.query("SELECT user_id FROM comments WHERE id = $1", [commentId])
        if (check.rows.length === 0) return { answer: "false", info: "Комментарий не найден", code: 404 }
        if (check.rows[0].user_id !== userId) return { answer: "false", info: "Нет доступа", code: 403 }
        await db.query("DELETE FROM comments WHERE id = $1", [commentId])
        return { answer: "true", info: "Комментарий удалён" }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при удалении комментария" }
    }
}

export { modCreateComment, modDeleteComment }