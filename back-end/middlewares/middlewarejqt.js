import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../utils/jwt.js";

// достаём токен из cookie FeelsGoodMan или иначе из заголовка Authorization
function getToken(request) {
    let token = request.cookies?.FeelsGoodMan
    if (!token) {
        const header = request.headers.authorization
        if (header) token = header.split(" ")[1]
    }
    return token
}

// middleware обязательной проверки токена
function auth(request, response, next) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(401).json({ message: "Нет access токена" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        request.user = payload; // { id, role, iat, exp }
        next();
    } catch (err) {
        // Важно: если токен просрочен, клиент должен попробовать обновить его через /api/refresh
        return response.status(401).json({ message: "Access токен недействителен или просрочен" });
    }
}

// middleware необязательной проверки: если токен есть распарсим, если нет пропустим
function optionalAuth(request, response, next) {
    const token = getToken(request)
    if (token) {
        try {
            request.user = jwt.verify(token, SECRETKEY)
        } catch (err) {  }
    }
    next()
}

// middleware проверки роли
function requireRole(role) {
    return (request, response, next) => {
        if (!request.user || request.user.role !== role) {
            response.status(403)
            response.set("Content-Type", "application/json")
            response.send(JSON.stringify({ "answer": "false", "info": "Нет доступа" }))
            return
        }
        next()
    }
}

// middleware проверки списка ролей
function requireRoles(roles) {
    return (request, response, next) => {
        if (!request.user || !roles.includes(request.user.role)) {
            response.status(403)
            response.set("Content-Type", "application/json")
            response.send(JSON.stringify({ "answer": "false", "info": "Нет доступа" }))
            return
        }
        next()
    }
}

export { auth, optionalAuth, requireRole, requireRoles, getToken }