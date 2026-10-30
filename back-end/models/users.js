import { db } from "../db.js"

async function modGetProfileById(userId) {
    try {
        const result = await db.query(
            "SELECT id, name, email, avatar_url, created_at, role FROM users WHERE id = $1",
            [userId]
        )
        if (result.rows.length === 0) {
            return { answer: "false", info: "Пользователь не найден" }
        }
        return { answer: "true", info: result.rows[0] }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении профиля" }
    }
}

async function modGetProfileByName(name, currentUserId) {
    try {
        const result = await db.query(
            "SELECT id, name, email, avatar_url, created_at, role FROM users WHERE name = $1",
            [name]
        )
        if (result.rows.length === 0) {
            return { answer: "false", info: "Пользователь не найден" }
        }
        const user = result.rows[0]
        let isFollowing = false
        if (currentUserId) {
            const sub = await db.query(
                "SELECT 1 FROM subscriptions WHERE subscriber_id = $1 AND target_user_id = $2",
                [currentUserId, user.id]
            )
            isFollowing = sub.rows.length > 0
        }
        return { answer: "true", info: { ...user, isFollowing } }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении профиля" }
    }
}

async function modUpdateProfile(userId, name, email) {
    try {
        const current = await db.query("SELECT name, email FROM users WHERE id = $1", [userId])
        if (current.rows.length === 0) {
            return { answer: "false", info: "Пользователь не найден" }
        }
        if (current.rows[0].name !== name) {
            const check = await db.query("SELECT 1 FROM users WHERE name = $1 AND id != $2", [name, userId])
            if (check.rows.length > 0) return { answer: "false", info: "Имя пользователя уже занято" }
        }
        if (current.rows[0].email !== email) {
            const check = await db.query("SELECT 1 FROM users WHERE email = $1 AND id != $2", [email, userId])
            if (check.rows.length > 0) return { answer: "false", info: "Email уже занят" }
        }
        await db.query("UPDATE users SET name = $1, email = $2 WHERE id = $3", [name, email, userId])
        return { answer: "true", info: "Профиль успешно обновлен" }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при обновлении профиля" }
    }
}

async function modChangeAvatarUrl(userId, newUrl) {
    try {
        await db.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [newUrl, userId])
        return { answer: "true", info: newUrl }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при смене аватара" }
    }
}

async function modGetAvatarUrl(userId) {
    const result = await db.query("SELECT avatar_url FROM users WHERE id = $1", [userId])
    return result.rows[0]?.avatar_url
}

async function modGetAllUsers() {
    try {
        const result = await db.query(
            "SELECT id, name, email, avatar_url, created_at, role FROM users ORDER BY id"
        )
        return { answer: "true", info: result.rows }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении пользователей" }
    }
}

export {
    modGetProfileById, modGetProfileByName, modUpdateProfile,
    modChangeAvatarUrl, modGetAvatarUrl, modGetAllUsers
}