import { Router } from 'express'
import { albumController } from '../controllers/album.controller'
import { validate } from '../middlewares/validate'
import { asyncHandler } from '../utils/asyncHandler'
import {
  albumIdParamsSchema,
  createAlbumSchema,
  updateAlbumSchema,
} from '../validations/album.schema'

export const albumRoutes = Router()

albumRoutes.get('/', asyncHandler(albumController.list))
albumRoutes.get(
  '/:id',
  validate(albumIdParamsSchema, 'params'),
  asyncHandler(albumController.getById),
)
albumRoutes.post('/', validate(createAlbumSchema, 'body'), asyncHandler(albumController.create))
albumRoutes.put(
  '/:id',
  validate(albumIdParamsSchema, 'params'),
  validate(updateAlbumSchema, 'body'),
  asyncHandler(albumController.update),
)
albumRoutes.delete(
  '/:id',
  validate(albumIdParamsSchema, 'params'),
  asyncHandler(albumController.delete),
)
