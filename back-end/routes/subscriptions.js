import express from "express"
import { getMySubscriptions, followUser, unfollowUser } from "../controllers/subscriptions.js"
import { auth } from "../middlewares/middlewarejqt.js"

const router = express.Router()

router.get("/", auth, getMySubscriptions)
router.post("/user/:targetId", auth, followUser)
router.delete("/user/:targetId", auth, unfollowUser)

export { router as subscriptionRoutes }