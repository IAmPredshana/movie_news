const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "031f101587525c6a374e6524dd43cc75";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "031f101587525c6a374e6524dd43cc75";

const ACCESS_EXPIRES_IN = "15m"; // 15 минут
const REFRESH_EXPIRES_IN = "7d";  // 7 дней

function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
}

export { ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN, parseJwt }