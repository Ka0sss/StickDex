import { z } from 'zod'

export const collectionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const collectionStickerParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  stickerId: z.coerce.number().int().positive(),
})

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  albumId: z.number().int().positive(),
  isPublic: z.boolean().optional().default(false),
  userId: z.number().int().positive().optional(),
})

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
})

export const addCollectedStickerSchema = z.object({
  stickerId: z.number().int().positive(),
  quantity: z.number().int().positive().optional(),
  isDuplicated: z.boolean().optional(),
})

export const updateCollectedStickerSchema = z.object({
  quantity: z.number().int().positive().optional(),
  isDuplicated: z.boolean().optional(),
})

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type AddCollectedStickerInput = z.infer<typeof addCollectedStickerSchema>
export type UpdateCollectedStickerInput = z.infer<typeof updateCollectedStickerSchema>
