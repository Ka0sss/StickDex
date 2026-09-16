// Espejo de app/backend/src/validations/album.schema.ts: mantén los límites sincronizados.
import { z } from 'zod'
import {
  imageUrlField,
  nonEmptyUpdate,
  nullableDate,
  optionalText,
  positiveInt,
  requiredText,
} from '@/validations/common'

export const createAlbumSchema = z.object({
  name: requiredText(100),
  description: optionalText(500),
  imageUrl: imageUrlField.optional(),
  releaseDate: nullableDate.optional(),
  stickerType: optionalText(50),
  totalStickers: positiveInt,
})

export const updateAlbumSchema = nonEmptyUpdate(createAlbumSchema.partial())

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>
