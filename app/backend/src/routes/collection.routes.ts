import { Router } from 'express'
import { collectionController } from '../controllers/collection.controller'
import { validate } from '../middlewares/validate'
import { asyncHandler } from '../utils/asyncHandler'
import { collectionIdParamsSchema } from '../validations/collection.schema'

export const collectionRoutes = Router()

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
