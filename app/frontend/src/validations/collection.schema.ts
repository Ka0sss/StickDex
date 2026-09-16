// Espejo de app/backend/src/validations/collection.schema.ts: mantén los límites sincronizados.
import { z } from 'zod'
import { nonEmptyUpdate, positiveInt, requiredText } from '@/validations/common'

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
})

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type AddCollectedStickerInput = z.infer<typeof addCollectedStickerSchema>
