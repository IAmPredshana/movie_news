import { modCreateComment, modDeleteComment } from "../models/comments.js"

async function createComment(request, response) {
    const { content, articleId } = request.body
    const result = await modCreateComment(request.user.id, articleId, content)
    if (result.answer === "false") {
        response.status(result.code || 400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Комментарий создан", comment: result.info }))
}

async function deleteComment(request, response) {
    const id = parseInt(request.params.id)
    const result = await modDeleteComment(id, request.user.id)
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

export { createComment, deleteComment }