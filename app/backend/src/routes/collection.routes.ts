import { Router } from 'express'
import { collectionController } from '../controllers/collection.controller'
import { requireAuth } from '../middlewares/requireAuth'
import { validate } from '../middlewares/validate'
import { asyncHandler } from '../utils/asyncHandler'
import {
  addCollectedStickerSchema,
  collectionIdParamsSchema,
  collectionStickerParamsSchema,
  createCollectionSchema,
  updateCollectedStickerSchema,
  updateCollectionSchema,
} from '../validations/collection.schema'

export const collectionRoutes = Router()

collectionRoutes.get('/', asyncHandler(collectionController.list))
collectionRoutes.post(
  '/',
  requireAuth,
  validate(createCollectionSchema, 'body'),
  asyncHandler(collectionController.create),
)

collectionRoutes.get(
  '/:id/missing',
  validate(collectionIdParamsSchema, 'params'),
  asyncHandler(collectionController.missing),
)
collectionRoutes.get(
  '/:id/duplicates',
  validate(collectionIdParamsSchema, 'params'),
  asyncHandler(collectionController.duplicates),
)

collectionRoutes.get(
  '/:id',
  validate(collectionIdParamsSchema, 'params'),
  asyncHandler(collectionController.getById),
)
collectionRoutes.put(
  '/:id',
  requireAuth,
  validate(collectionIdParamsSchema, 'params'),
  validate(updateCollectionSchema, 'body'),
  asyncHandler(collectionController.update),
)
collectionRoutes.delete(
  '/:id',
  requireAuth,
  validate(collectionIdParamsSchema, 'params'),
  asyncHandler(collectionController.delete),
)

collectionRoutes.post(
  '/:id/stickers',
  requireAuth,
  validate(collectionIdParamsSchema, 'params'),
  validate(addCollectedStickerSchema, 'body'),
  asyncHandler(collectionController.addSticker),
)
collectionRoutes.put(
  '/:id/stickers/:stickerId',
  requireAuth,
  validate(collectionStickerParamsSchema, 'params'),
  validate(updateCollectedStickerSchema, 'body'),
  asyncHandler(collectionController.updateSticker),
)
collectionRoutes.delete(
  '/:id/stickers/:stickerId',
  requireAuth,
  validate(collectionStickerParamsSchema, 'params'),
  asyncHandler(collectionController.removeSticker),
)
