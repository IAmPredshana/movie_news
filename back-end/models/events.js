import { db } from "../db.js"

async function modGetEventsByDate(date) {
    try {
        const result = await db.query(`
            SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.created_at,
                   u.id AS user_id, u.name, u.avatar_url
            FROM events e JOIN users u ON u.id = e.user_id
            WHERE e.event_date = $1
            ORDER BY e.event_time
        `, [date])
        return {
            answer: "true",
            info: result.rows.map(r => ({
                id: r.id,
                title: r.title,
                description: r.description,
                event_date: r.event_date,
                event_time: r.event_time,
                created_at: r.created_at,
                user: { id: r.user_id, name: r.name, avatar_url: r.avatar_url }
            }))
        }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении событий" }
    }
}

async function modCreateEvent(userId, title, description, eventDate, eventTime, createdAt) {
    try {
        const result = await db.query(`
            INSERT INTO events (title, description, user_id, event_date, event_time, created_at)
            VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
            RETURNING *
        `, [title, description, userId, eventDate, eventTime, createdAt || null])
        return { answer: "true", info: result.rows[0] }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при создании события" }
    }
}

async function modDeleteEvent(eventId, userId) {
    try {
        const check = await db.query("SELECT user_id FROM events WHERE id = $1", [eventId])
        if (check.rows.length === 0) return { answer: "false", info: "Событие не найдено", code: 404 }
        if (check.rows[0].user_id !== userId) return { answer: "false", info: "Нет доступа", code: 403 }
        await db.query("DELETE FROM events WHERE id = $1", [eventId])
        return { answer: "true", info: "Событие удалено" }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при удалении события" }
    }
}

export { modGetEventsByDate, modCreateEvent, modDeleteEvent }