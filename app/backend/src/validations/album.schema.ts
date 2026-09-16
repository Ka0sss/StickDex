import { z } from 'zod'
import {
  idParam,
  imageUrlField,
  nonEmptyUpdate,
  nullableDate,
  optionalText,
  positiveInt,
  requiredText,
} from './common'

/** Parámetro :id de las rutas /albums/:id */
export const albumParamsSchema = z.object({
  id: idParam,
})

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
