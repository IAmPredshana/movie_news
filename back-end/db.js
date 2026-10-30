const USERDB = "postgres"
const PASSWORDDB = "admin"
const HOSTDB = "localhost"
const PORTDB = 5432
const DATABASEDB = "news"

import { Pool } from "pg"

const pool = new Pool({
    user: USERDB,
    host: HOSTDB,
    database: DATABASEDB,
    password: PASSWORDDB,
    port: PORTDB,
})

pool.on('error', (err) => {
    console.error('ошибка пула:', err)
})

const db = {
    query: (text, params) => pool.query(text, params)
}

export { db }