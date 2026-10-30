import { db } from "../db.js"

async function modGetAllTags() {
    try {
        const result = await db.query("SELECT id, title FROM tags ORDER BY title")
        return { answer: "true", info: result.rows }
    } catch (err) {
        console.error(err)
        return { answer: "false", info: "Ошибка при получении тегов" }
    }
}

export { modGetAllTags }