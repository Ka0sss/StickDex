import fs from 'fs'
import path from 'path'
import multer from 'multer'
import type { Request } from 'express'
import { HttpError } from '@/utils/httpError'
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_EXTENSION_BY_MIME,
  MAX_UPLOAD_BYTES,
  type AllowedImageMime,
} from '@/validations/upload.schema'

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    // La extensión sale del MIME: el nombre original podría colar un `.html`/`.svg`
    // que después se serviría desde `/uploads`.
    const extension = IMAGE_EXTENSION_BY_MIME[file.mimetype as AllowedImageMime]
    cb(null, `${uniqueSuffix}${extension}`)
  },
})

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
    cb(null, true)
    return
  }
  cb(new HttpError(400, 'Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP, GIF)'))
}

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter,
})
