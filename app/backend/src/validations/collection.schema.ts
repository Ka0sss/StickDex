import { z } from 'zod'
import { MAX_INT_32, idParam, nonEmptyUpdate, positiveInt, requiredText } from './common'

export const collectionIdParamsSchema = z.object({
  id: idParam,
})

export const collectionStickerParamsSchema = z.object({
  id: idParam,
  stickerId: idParam,
})

export const listCollectionsQuerySchema = z.object({
  userId: z.coerce.number().int().positive().max(MAX_INT_32).optional(),
  isPublic: z
    .enum(['true', 'false'], { message: "Debe ser 'true' o 'false'" })
    .transform((value) => value === 'true')
    .optional(),
})

export const createCollectionSchema = z.object({
  name: requiredText(100),
  albumId: positiveInt,
  isPublic: z.boolean().optional().default(false),
})

export const updateCollectionSchema = nonEmptyUpdate(
  z.object({
    name: requiredText(100).optional(),
    isPublic: z.boolean().optional(),
  }),
)

export const addCollectedStickerSchema = z.object({
  stickerId: positiveInt,
  quantity: positiveInt.optional(),
  isDuplicated: z.boolean().optional(),
})

export const updateCollectedStickerSchema = nonEmptyUpdate(
  z.object({
    quantity: positiveInt.optional(),
    isDuplicated: z.boolean().optional(),
  }),
)

export type ListCollectionsQuery = z.infer<typeof listCollectionsQuerySchema>
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type AddCollectedStickerInput = z.infer<typeof addCollectedStickerSchema>
export type UpdateCollectedStickerInput = z.infer<typeof updateCollectedStickerSchema>
