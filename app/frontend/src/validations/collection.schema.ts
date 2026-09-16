// Espejo de app/backend/src/validations/collection.schema.ts: mantén los límites sincronizados.
// El cliente no valida params ni query (los construye desde su propia sesión y literales);
// el servidor los valida con collectionIdParamsSchema y listCollectionsQuerySchema.
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
  // La UI no lo envía: el servidor deriva `isDuplicated` de la cantidad.
  isDuplicated: z.boolean().optional(),
})

export const updateCollectedStickerSchema = nonEmptyUpdate(
  z.object({
    quantity: positiveInt.optional(),
    isDuplicated: z.boolean().optional(),
  }),
)

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type AddCollectedStickerInput = z.infer<typeof addCollectedStickerSchema>
export type UpdateCollectedStickerInput = z.infer<typeof updateCollectedStickerSchema>
