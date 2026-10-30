import express from "express"
import {
    getArticles, getFeed, getArticle,
    createArticle, updateArticle, deleteArticle,
    likeArticle, unlikeArticle, uploadArticleImage, deleteArticleImage
} from "../controllers/articles.js"
import { auth, optionalAuth } from "../middlewares/middlewarejqt.js"

const router = express.Router()

router.get("/", optionalAuth, getArticles)
router.get("/feed", auth, getFeed)
router.get("/:id", optionalAuth, getArticle)
router.post("/", auth, createArticle)
router.put("/:id", auth, updateArticle)
router.delete("/:id", auth, deleteArticle)
router.post("/:id/like", auth, likeArticle)
router.delete("/:id/like", auth, unlikeArticle)
router.post("/:id/image", auth, uploadArticleImage)
router.delete("/:id/image", auth, deleteArticleImage)

export { router as articleRoutes }