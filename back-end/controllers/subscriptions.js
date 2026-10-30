import { modGetMySubscriptions, modFollowUser, modUnfollowUser } from "../models/subscriptions.js"

async function getMySubscriptions(request, response) {
    const result = await modGetMySubscriptions(request.user.id)
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

async function followUser(request, response) {
    const targetId = parseInt(request.params.targetId)
    const result = await modFollowUser(request.user.id, targetId)
    if (result.answer === "false") {
        response.status(result.code || 400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Подписка успешна", sub: result.info }))
}

async function unfollowUser(request, response) {
    const targetId = parseInt(request.params.targetId)
    const result = await modUnfollowUser(request.user.id, targetId)
    if (result.answer === "false") {
        response.status(result.code || 400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: result.info }))
}

export { getMySubscriptions, followUser, unfollowUser }