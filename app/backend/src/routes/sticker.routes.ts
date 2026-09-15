import { Router } from 'express'
import { stickerController } from '../controllers/sticker.controller'
import { requireAuth } from '../middlewares/requireAuth'
import { validate } from '../middlewares/validate'
import { asyncHandler } from '../utils/asyncHandler'
import {
  albumIdParamsSchema,
  createStickerSchema,
  createStickersBulkSchema,
  stickerIdParamsSchema,
  updateStickerSchema,
} from '../validations/sticker.schema'

// Rutas absolutas; se montan en la raíz del router de la API.
export const stickerRoutes = Router()

stickerRoutes.get(
  '/albums/:albumId/stickers',
  validate(albumIdParamsSchema, 'params'),
  asyncHandler(stickerController.listByAlbum),
)
stickerRoutes.post(
  '/albums/:albumId/stickers',
  requireAuth,
  validate(albumIdParamsSchema, 'params'),
  validate(createStickerSchema, 'body'),
  asyncHandler(stickerController.create),
)
stickerRoutes.post(
  '/albums/:albumId/stickers/bulk',
  requireAuth,
  validate(albumIdParamsSchema, 'params'),
  validate(createStickersBulkSchema, 'body'),
  asyncHandler(stickerController.createBulk),
)
stickerRoutes.put(
  '/stickers/:id',
  requireAuth,
  validate(stickerIdParamsSchema, 'params'),
  validate(updateStickerSchema, 'body'),
  asyncHandler(stickerController.update),
)
stickerRoutes.delete(
  '/stickers/:id',
  requireAuth,
  validate(stickerIdParamsSchema, 'params'),
  asyncHandler(stickerController.delete),
)
