import { Router } from 'express'
import { collectionController } from '@/config/container'
import { requireAuth } from '@/middlewares/requireAuth'
import { validate } from '@/middlewares/validate'
import {
  addCollectedStickerSchema,
  collectionIdParamsSchema,
  collectionStickerParamsSchema,
  createCollectionSchema,
  listCollectionsQuerySchema,
  updateCollectedStickerSchema,
  updateCollectionSchema,
} from '@/validations/collection.schema'

export const collectionRoutes = Router()

collectionRoutes.get('/', validate(listCollectionsQuerySchema, 'query'), collectionController.list)
collectionRoutes.post(
  '/',
  requireAuth,
  validate(createCollectionSchema, 'body'),
  collectionController.create,
)

collectionRoutes.get(
  '/:id/missing',
  validate(collectionIdParamsSchema, 'params'),
  collectionController.missing,
)
collectionRoutes.get(
  '/:id/duplicates',
  validate(collectionIdParamsSchema, 'params'),
  collectionController.duplicates,
)

collectionRoutes.get(
  '/:id',
  validate(collectionIdParamsSchema, 'params'),
  collectionController.getById,
)
collectionRoutes.put(
  '/:id',
  requireAuth,
  validate(collectionIdParamsSchema, 'params'),
  validate(updateCollectionSchema, 'body'),
  collectionController.update,
)
collectionRoutes.delete(
  '/:id',
  requireAuth,
  validate(collectionIdParamsSchema, 'params'),
  collectionController.delete,
)

collectionRoutes.post(
  '/:id/stickers',
  requireAuth,
  validate(collectionIdParamsSchema, 'params'),
  validate(addCollectedStickerSchema, 'body'),
  collectionController.addSticker,
)
collectionRoutes.put(
  '/:id/stickers/:stickerId',
  requireAuth,
  validate(collectionStickerParamsSchema, 'params'),
  validate(updateCollectedStickerSchema, 'body'),
  collectionController.updateSticker,
)
collectionRoutes.delete(
  '/:id/stickers/:stickerId',
  requireAuth,
  validate(collectionStickerParamsSchema, 'params'),
  collectionController.removeSticker,
)
