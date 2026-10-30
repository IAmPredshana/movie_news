import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
    modGetArticles, modGetFeed, modGetArticleById,
    modCreateArticle, modUpdateArticle, modDeleteArticle,
    modLikeArticle, modUnlikeArticle,
    modGetArticleImageUrl, modSetArticleImage, modClearArticleImage
} from "../models/articles.js"
import { saveRawFile } from "../middlewares/upload.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(path.dirname(__filename))

async function getArticles(request, response) {
    const page = parseInt(request.query.page) || 1
    const pageSize = parseInt(request.query.pageSize) || 20
    const { search, tag, sortBy, username } = request.query

    const result = await modGetArticles({ search, tag, sortBy, page, pageSize, username })
    if (result.answer === "false") {
        response.status(500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }

    const { articles, totalCount } = result.info
    const hasMore = page * pageSize < totalCount

    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({
        articles,
        pagination: {
            currentPage: page, pageSize, totalCount, hasMore,
            nextPage: hasMore ? page + 1 : null
        }
    }))
}

async function getFeed(request, response) {
    const page = parseInt(request.query.page) || 1
    const pageSize = parseInt(request.query.pageSize) || 20
    const result = await modGetFeed(request.user.id, page, pageSize)
    if (result.answer === "false") {
        response.status(500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    const { articles, totalCount } = result.info
    const hasMore = page * pageSize < totalCount
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({
        articles,
        pagination: {
            currentPage: page, pageSize, totalCount, hasMore,
            nextPage: hasMore ? page + 1 : null
        }
    }))
}

async function getArticle(request, response) {
    const id = parseInt(request.params.id)
    const currentUserId = request.user?.id || null
    const result = await modGetArticleById(id, currentUserId)
    if (result.answer === "false") {
        response.status(404)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify(result.info))
}

async function createArticle(request, response) {
    const { title, content, tags } = request.body
    if (!title || !content) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Заголовок и содержимое обязательны" }))
        return
    }
    const result = await modCreateArticle(request.user.id, title, content, tags || [])
    if (result.answer === "false") {
        response.status(500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Статья успешно создана", articleId: result.info }))
}

async function updateArticle(request, response) {
    const id = parseInt(request.params.id)
    const { title, content, tags } = request.body
    if (!title || !content) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Заголовок и содержимое обязательны" }))
        return
    }
    const result = await modUpdateArticle(id, request.user.id, title, content, tags || [])
    if (result.answer === "false") {
        response.status(result.code || 500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: result.info }))
}

async function deleteArticle(request, response) {
    const id = parseInt(request.params.id)
    const result = await modDeleteArticle(id, request.user.id)
    if (result.answer === "false") {
        response.status(result.code || 500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: result.info }))
}

async function likeArticle(request, response) {
    const id = parseInt(request.params.id)
    const result = await modLikeArticle(id, request.user.id)
    if (result.answer === "false") {
        response.status(result.code || 400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Статья лайкнута", likesCount: result.info, isLiked: true }))
}

async function unlikeArticle(request, response) {
    const id = parseInt(request.params.id)
    const result = await modUnlikeArticle(id, request.user.id)
    if (result.answer === "false") {
        response.status(result.code || 400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Лайк удалён", likesCount: result.info, isLiked: false }))
}

async function uploadArticleImage(request, response) {
    const id = parseInt(request.params.id)
    const articleRow = await modGetArticleImageUrl(id)
    if (!articleRow) {
        response.status(404)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Статья не найдена" }))
        return
    }
    if (articleRow.user_id !== request.user.id) {
        response.status(403)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Нет доступа" }))
        return
    }

    const saved = await saveRawFile(request, {
        folder: "articles",
        makeName: (ext) => `article${id}_${Date.now()}${ext}`
    })
    if (!saved.ok) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: saved.info }))
        return
    }

    await modSetArticleImage(id, saved.fileUrl)
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Изображение загружено", image: saved.fileUrl }))
}

async function deleteArticleImage(request, response) {
    const id = parseInt(request.params.id)
    const articleRow = await modGetArticleImageUrl(id)
    if (!articleRow) {
        response.status(404)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Статья не найдена" }))
        return
    }
    if (articleRow.user_id !== request.user.id) {
        response.status(403)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Нет доступа" }))
        return
    }
    if (articleRow.image_url && articleRow.image_url.startsWith("/uploads/articles/")) {
        const fileName = path.basename(articleRow.image_url)
        const filePath = path.join(__dirname, "uploads", "articles", fileName)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    await modClearArticleImage(id)
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Обложка статьи удалена" }))
}

export {
    getArticles, getFeed, getArticle,
    createArticle, updateArticle, deleteArticle,
    likeArticle, unlikeArticle, uploadArticleImage, deleteArticleImage
}