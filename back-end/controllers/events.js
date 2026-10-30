import { modGetEventsByDate, modCreateEvent, modDeleteEvent } from "../models/events.js"

async function getEvents(request, response) {
    const date = request.query.date
    if (!date) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Параметр date обязателен" }))
        return
    }
    const result = await modGetEventsByDate(date)
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

async function createEvent(request, response) {
    const { title, description, event_date, event_time, created_at } = request.body
    if (!title || !description) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Заголовок и описание обязательны" }))
        return
    }
    const result = await modCreateEvent(request.user.id, title, description, event_date, event_time, created_at)
    if (result.answer === "false") {
        response.status(500)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Событие создано", eventItem: result.info }))
}

async function deleteEvent(request, response) {
    const id = parseInt(request.params.id)
    const result = await modDeleteEvent(id, request.user.id)
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

export { getEvents, createEvent, deleteEvent }