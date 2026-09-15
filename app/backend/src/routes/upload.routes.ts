import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth'
import { uploadMiddleware } from '../middlewares/upload'
import { HttpError } from '../utils/httpError'

export const uploadRoutes = Router()

uploadRoutes.post('/', requireAuth, uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) {
    throw new HttpError(400, 'No se proporcionó ningún archivo de imagen')
  }

  const imageUrl = `/uploads/${req.file.filename}`
  res.status(201).json({
    imageUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  })
})
