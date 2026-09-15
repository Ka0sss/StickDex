import { Router } from 'express'
import { collectionController } from '../controllers/collection.controller'
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
  validate(collectionIdParamsSchema, 'params'),
  validate(updateCollectionSchema, 'body'),
  asyncHandler(collectionController.update),
)
collectionRoutes.delete(
  '/:id',
  validate(collectionIdParamsSchema, 'params'),
  asyncHandler(collectionController.delete),
)

collectionRoutes.post(
  '/:id/stickers',
  validate(collectionIdParamsSchema, 'params'),
  validate(addCollectedStickerSchema, 'body'),
  asyncHandler(collectionController.addSticker),
)
collectionRoutes.put(
  '/:id/stickers/:stickerId',
  validate(collectionStickerParamsSchema, 'params'),
  validate(updateCollectedStickerSchema, 'body'),
  asyncHandler(collectionController.updateSticker),
)
collectionRoutes.delete(
  '/:id/stickers/:stickerId',
  validate(collectionStickerParamsSchema, 'params'),
  asyncHandler(collectionController.removeSticker),
)
