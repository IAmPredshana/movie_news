import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
    modGetProfileById, modGetProfileByName, modUpdateProfile,
    modChangeAvatarUrl, modGetAvatarUrl, modGetAllUsers
} from "../models/users.js"
import { saveRawFile } from "../middlewares/upload.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(path.dirname(__filename))

async function getMyProfile(request, response) {
    const result = await modGetProfileById(request.user.id)
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

async function getProfileByName(request, response) {
    const currentUserId = request.user?.id || null
    const result = await modGetProfileByName(request.params.name, currentUserId)
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

async function updateProfile(request, response) {
    const { name, email } = request.body
    const result = await modUpdateProfile(request.user.id, name, email)
    if (result.answer === "false") {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: result.info }))
}

async function uploadAvatar(request, response) {
    const saved = await saveRawFile(request, {
        folder: "avatars",
        makeName: (ext) => `avatar_${request.user.id}_${Date.now()}${ext}`
    })
    if (!saved.ok) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: saved.info }))
        return
    }
    await modChangeAvatarUrl(request.user.id, saved.fileUrl)
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Аватар успешно загружен", avatarUrl: saved.fileUrl }))
}

async function deleteAvatar(request, response) {
    const currentUrl = await modGetAvatarUrl(request.user.id)
    if (currentUrl && currentUrl.startsWith("/uploads/avatars/")) {
        const fileName = path.basename(currentUrl)
        const filePath = path.join(__dirname, "uploads", "avatars", fileName)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    await modChangeAvatarUrl(request.user.id, "")
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Аватар удалён" }))
}

async function getAllUsers(request, response) {
    const result = await modGetAllUsers()
    if (result.answer === "false") {
        response.status(500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify(result.info))
}

export {
    getMyProfile, getProfileByName, updateProfile,
    uploadAvatar, deleteAvatar, getAllUsers
}