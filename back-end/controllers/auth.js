import jwt from "jsonwebtoken";
import { modLogin } from "../models/auth.js";
import { redis } from "../redis.js";
import {
  ACCESS_SECRET,
  REFRESH_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN
} from "../utils/jwt.js";

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
    const { email, password } = request.body;
    const result = await modLogin(email, password);

    if (result.answer === "false") {
        response.status(400).set("Content-Type", "application/json");
        response.send(JSON.stringify({ message: result.info }));
        return;
    }

    const user = result.info;

    // Access token
    const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );

    //Refresh token
    const refreshToken = jwt.sign(
        { id: user.id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );

    await redis.set(`refresh_token:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60);
    // await redis.set(`refresh_token:${user.id}`, refreshToken, "EX", 2 * 60);

    // Acsess token в HttpOnly!!!!!!
    response.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax", 
        secure: false, // не https
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    });

    response.status(200).set("Content-Type", "application/json");
    response.send(JSON.stringify({
        accessToken: accessToken
    }));
}

async function refresh(request, response) {
    const refreshToken = request.cookies.refreshToken; // из HttpOnly

    if (!refreshToken) {
        return response.status(401).json({ message: "нету refresh токена" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);

        // прокеряем что в редис есть рефреш токен
        const storedToken = await redis.get(`refresh_token:${payload.id}`);
        if (!storedToken || storedToken !== refreshToken) 
            return response.status(403).json({ message: "Refresh токен недействителен" });

        // Access token
        const newAccessToken = jwt.sign({ id: payload.id }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

        response.status(200).json({ accessToken: newAccessToken });

    } catch (err) {
        // рефреш токен просрочен или подпись неверна
        response.clearCookie("refreshToken", { path: '/' });
        return response.status(401).json({ message: "Недействительный refresh токен" });
    }
}

async function logout(request, response) {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
        try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        await redis.del(`refresh_token:${payload.id}`);
        } catch (e) { } // игнорим если токен не правильный
    }
    response.clearCookie("refreshToken", { path: '/' });
    response.status(200).json({ message: "Выход выполнен успешно" });
}


export { register, login, refresh, logout };