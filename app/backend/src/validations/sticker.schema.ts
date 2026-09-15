import { z } from 'zod'

export const stickerIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// Parámetro :albumId en rutas /albums/:albumId/stickers
export const albumIdParamsSchema = z.object({
  albumId: z.coerce.number().int().positive(),
})

export const createStickerSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1).max(100),
  imageUrl: z.string().max(500).optional(),
  type: z.string().max(50).optional(),
})

export const createStickersBulkSchema = z.object({
  stickers: z.array(createStickerSchema).min(1),
})

export const updateStickerSchema = createStickerSchema.partial()

export type CreateStickerInput = z.infer<typeof createStickerSchema>
export type UpdateStickerInput = z.infer<typeof updateStickerSchema>
