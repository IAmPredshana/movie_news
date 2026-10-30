import express from "express"
import { getEvents, createEvent, deleteEvent } from "../controllers/events.js"
import { auth } from "../middlewares/middlewarejqt.js"

const router = express.Router()

router.get("/", getEvents)
router.post("/", auth, createEvent)
router.delete("/:id", auth, deleteEvent)

export { router as eventRoutes }