import fs from 'fs'
import path from 'path'
import multer from 'multer'
import type { Request } from 'express'
import { HttpError } from '@/utils/httpError'

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * Extensión derivada del MIME declarado: nunca del nombre original, que podría
 * colar un `.html`/`.svg` servido después por `/uploads`.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${EXTENSION_BY_MIME[file.mimetype]}`)
  },
})

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (EXTENSION_BY_MIME[file.mimetype]) {
    cb(null, true)
    return
  }
  cb(new HttpError(400, 'Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP, GIF)'))
}

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter,
})
