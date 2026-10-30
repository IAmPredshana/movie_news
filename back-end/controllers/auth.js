import jwt from "jsonwebtoken"

import { modRegister, modLogin } from "../models/auth.js"
import { SECRETKEY, EXPIRES } from "../utils/jwt.js"

async function register(request, response) {
    const { name, email, password, role } = request.body
    if (!name || !email || !password) {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: "Все поля обязательны" }))
        return
    }

    const result = await modRegister(name, email, password, role || "User")
    if (result.answer === "false") {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }

    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({}))
}

async function login(request, response) {
    const { email, password } = request.body
    const result = await modLogin(email, password)
    if (result.answer === "false") {
        response.status(400)
        response.set("Content-Type", "application/json")
        response.send(JSON.stringify({ message: result.info }))
        return
    }

    const token = jwt.sign(
        { id: result.info.id, role: result.info.role },
        SECRETKEY,
        { expiresIn: EXPIRES }
    )

    response.cookie("FeelsGoodMan", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 12 * 60 * 60 * 1000
    })

    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({}))
}

function logout(request, response) {
    response.clearCookie("FeelsGoodMan")
    response.status(200)
    response.set("Content-Type", "application/json")
    response.send(JSON.stringify({ message: "Выход выполнен успешно" }))
}

export { register, login, logout }