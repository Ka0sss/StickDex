import { Router } from 'express'
import { albumController } from '@/config/container'
import { requireAuth } from '@/middlewares/requireAuth'
import { validate } from '@/middlewares/validate'
import { albumParamsSchema, createAlbumSchema, updateAlbumSchema } from '@/validations/album.schema'

export const albumRoutes = Router()

albumRoutes.get('/', albumController.list)
albumRoutes.get('/:id', validate(albumParamsSchema, 'params'), albumController.getById)
albumRoutes.post('/', requireAuth, validate(createAlbumSchema, 'body'), albumController.create)
albumRoutes.put(
  '/:id',
  requireAuth,
  validate(albumParamsSchema, 'params'),
  validate(updateAlbumSchema, 'body'),
  albumController.update,
)
albumRoutes.delete(
  '/:id',
  requireAuth,
  validate(albumParamsSchema, 'params'),
  albumController.delete,
)
