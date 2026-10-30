import { Pool } from "pg"

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    database: process.env.DB_NAME || 'news',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
})
pool.on('error', (err) => {
    console.error('ошибка пула:', err)
})

const db = {
    query: (text, params) => pool.query(text, params)
}

export { db }