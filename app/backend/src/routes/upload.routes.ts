import { Router } from 'express'
import { uploadController } from '@/config/container'
import { requireAuth } from '@/middlewares/requireAuth'
import { uploadMiddleware } from '@/middlewares/upload'
import { validate } from '@/middlewares/validate'
import { uploadedImageSchema } from '@/validations/upload.schema'

export const uploadRoutes = Router()

uploadRoutes.post(
  '/',
  requireAuth,
  uploadMiddleware.single('file'),
  validate(uploadedImageSchema, 'file'),
  uploadController.store,
)
