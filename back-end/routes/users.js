import express from "express"

import {
    getMyProfile, getProfileByName, updateProfile,
    uploadAvatar, deleteAvatar, getAllUsers
} from "../controllers/users.js"
import { auth, optionalAuth } from "../middlewares/middlewarejqt.js"

const router = express.Router()

router.get("/", getAllUsers)
router.get("/profile", auth, getMyProfile)
router.get("/profile/:name", optionalAuth, getProfileByName)
router.put("/profile", auth, updateProfile)
router.post("/avatar", auth, uploadAvatar)
router.delete("/avatar", auth, deleteAvatar)
router.get("/:name", optionalAuth, getProfileByName)

export { router as userRoutes }