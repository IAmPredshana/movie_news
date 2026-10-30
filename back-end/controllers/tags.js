import { modGetAllTags } from "../models/tags.js"

async function getTags(request, response) {
    const result = await modGetAllTags()
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

export { getTags }