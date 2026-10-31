import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

import { authRoutes } from "./routes/auth.js"
import { userRoutes } from "./routes/users.js"
import { articleRoutes } from "./routes/articles.js"
import { commentRoutes } from "./routes/comments.js"
import { tagRoutes } from "./routes/tags.js"
import { eventRoutes } from "./routes/events.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

fs.mkdirSync(path.join(__dirname, "uploads", "avatars"), { recursive: true })
fs.mkdirSync(path.join(__dirname, "uploads", "articles"), { recursive: true })

const corsOptions = {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}

const app = express()
const PORT = 3000

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

app.get("/api/health", (request, response) => {Subnautica
    response.status(200).set("Content-Type", "application/json")
    response.send(JSON.stringify({ ok: true }))
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/articles", articleRoutes)
app.use("/api/comments", commentRoutes)
app.use("/api/tags", tagRoutes)
app.use("/api/events", eventRoutes)

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})