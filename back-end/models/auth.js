import bcrypt from "bcrypt"
import { db } from "../db.js"

function roleToInt(role) {
    if (role === "CinemaCompany" || role === 1) return 1
    return 0
}

async function modRegister(name, email, password, role) {
    try {
        const existingName = await db.query(
            "SELECT 1 FROM users WHERE name = $1",
            [name.toLowerCase()]
        )
        if (existingName.rows.length > 0) {
            return { answer: "false", info: "Имя пользователя уже занято" }
        }

        const existingEmail = await db.query(
            "SELECT 1 FROM users WHERE email = $1",
            [email]
        )
        if (existingEmail.rows.length > 0) {
            return { answer: "false", info: "Пользователь с таким email уже существует" }
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const result = await db.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
            [name.toLowerCase(), email, passwordHash, roleToInt(role)]
        )
        return { answer: "true", info: result.rows[0].id }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при регистрации" }
    }
}

async function modLogin(email, password) {
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email])
        if (result.rows.length === 0) {
            return { answer: "false", info: "Неверный email или пароль" }
        }

        const user = result.rows[0]
        const isValid = await bcrypt.compare(password, user.password_hash)
        if (!isValid) {
            return { answer: "false", info: "Неверный email или пароль" }
        }

        return { answer: "true", info: user }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при входе" }
    }
}

export { modRegister, modLogin }