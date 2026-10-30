import express from "express"
import { createComment, deleteComment } from "../controllers/comments.js"
import { auth } from "../middlewares/middlewarejqt.js"

const router = express.Router()

router.post("/", auth, createComment)
router.delete("/:id", auth, deleteComment)

export { router as commentRoutes }