import { z } from 'zod'

export const albumIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const createAlbumSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().max(500).optional(),
  releaseDate: z.coerce.date().optional(),
  stickerType: z.string().max(50).optional(),
  totalStickers: z.number().int().positive(),
})

export const updateAlbumSchema = createAlbumSchema.partial()

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>
