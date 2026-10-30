import { db } from "../db.js"

async function modGetMySubscriptions(userId) {
    try {
        const result = await db.query(`
            SELECT s.id, u.id AS target_id, u.name, u.avatar_url, u.email
            FROM subscriptions s JOIN users u ON u.id = s.target_user_id
            WHERE s.subscriber_id = $1
        `, [userId])
        return {
            answer: "true",
            info: result.rows.map(r => ({
                id: r.id,
                targetUser: { id: r.target_id, name: r.name, avatar_url: r.avatar_url, email: r.email }
            }))
        }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении подписок" }
    }
}

async function modFollowUser(subscriberId, targetId) {
    try {
        if (subscriberId === targetId) return { answer: "false", info: "Вы не можете подписаться на себя", code: 400 }
        const target = await db.query("SELECT 1 FROM users WHERE id = $1", [targetId])
        if (target.rows.length === 0) return { answer: "false", info: "Пользователь не найден", code: 404 }
        const existing = await db.query(
            "SELECT 1 FROM subscriptions WHERE subscriber_id = $1 AND target_user_id = $2",
            [subscriberId, targetId]
        )
        if (existing.rows.length > 0) return { answer: "false", info: "Вы уже подписаны на этого пользователя", code: 400 }
        const inserted = await db.query(
            "INSERT INTO subscriptions (subscriber_id, target_user_id) VALUES ($1, $2) RETURNING id",
            [subscriberId, targetId]
        )
        return { answer: "true", info: inserted.rows[0].id }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при подписке" }
    }
}

async function modUnfollowUser(subscriberId, targetId) {
    try {
        const existing = await db.query(
            "SELECT 1 FROM subscriptions WHERE subscriber_id = $1 AND target_user_id = $2",
            [subscriberId, targetId]
        )
        if (existing.rows.length === 0) return { answer: "false", info: "Вы не подписаны на этого пользователя", code: 400 }
        await db.query(
            "DELETE FROM subscriptions WHERE subscriber_id = $1 AND target_user_id = $2",
            [subscriberId, targetId]
        )
        return { answer: "true", info: "Подписка отменена" }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при отмене подписки" }
    }
}

export { modGetMySubscriptions, modFollowUser, modUnfollowUser }