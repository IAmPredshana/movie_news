import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(path.dirname(__filename))

const allowedExtensions = [".jpg", ".jpeg", ".png"]

function saveRawFile(request, { folder, makeName }) {
    return new Promise((resolve) => {
        const rawName = request.get("X-Filename")
        if (!rawName) {
            request.resume()
            resolve({ ok: false, info: "не передан заголовок X-Filename" })
            return
        }

        let decodedName
        try {
            decodedName = decodeURIComponent(rawName)
        } catch {
            request.resume()
            resolve({ ok: false, info: "некорректный X-Filename" })
            return
        }

        const ext = path.extname(decodedName).toLowerCase()
        if (!allowedExtensions.includes(ext)) {
            request.resume()
            resolve({ ok: false, info: "оедопустимый формат файла" })
            return
        }

        const fileName = makeName(ext)
        const filePath = path.join(__dirname, "uploads", folder, fileName)
        const writeStream = fs.createWriteStream(filePath)

        request.pipe(writeStream)

        writeStream.on("finish", () => {
            resolve({
                ok: true,
                fileName,
                filePath,
                fileUrl: `/uploads/${folder}/${fileName}`
            })
        })
        writeStream.on("error", () => {
            resolve({ ok: false, info: "ошибка при сохранении файла" })
        })
        request.on("error", () => {
            resolve({ ok: false, info: "ошибка при чтении файла" })
        })
    })
}

export { saveRawFile }