import { z } from 'zod'
import {
  idParam,
  imageUrlField,
  nonEmptyUpdate,
  optionalText,
  positiveInt,
  requiredText,
} from './common'

/** Tope de láminas aceptadas en una sola carga masiva. */
export const MAX_BULK_STICKERS = 500

export const stickerIdParamsSchema = z.object({
  id: idParam,
})

/** Parámetro :albumId en rutas /albums/:albumId/stickers */
export const albumIdParamsSchema = z.object({
  albumId: idParam,
})

export const createStickerSchema = z.object({
  number: positiveInt,
  name: requiredText(100),
  imageUrl: imageUrlField.optional(),
  type: optionalText(50),
})

export const createStickersBulkSchema = z.object({
  stickers: z.array(createStickerSchema).min(1).max(MAX_BULK_STICKERS),
})

export const updateStickerSchema = nonEmptyUpdate(createStickerSchema.partial())

export type CreateStickerInput = z.infer<typeof createStickerSchema>
export type UpdateStickerInput = z.infer<typeof updateStickerSchema>
