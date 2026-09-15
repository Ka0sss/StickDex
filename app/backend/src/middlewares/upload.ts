import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { HttpError } from '../utils/httpError'

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${ext}`)
  },
})

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new HttpError(400, 'Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP, GIF)'))
    }
  },
})
