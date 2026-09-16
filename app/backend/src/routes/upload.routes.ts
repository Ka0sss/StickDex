import { Router } from 'express'
import { uploadController } from '@/config/container'
import { requireAuth } from '@/middlewares/requireAuth'
import { uploadMiddleware } from '@/middlewares/upload'

export const uploadRoutes = Router()

uploadRoutes.post('/', requireAuth, uploadMiddleware.single('file'), uploadController.store)
