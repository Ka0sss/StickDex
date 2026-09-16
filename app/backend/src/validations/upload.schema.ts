import { z } from 'zod'

/** Tamaño máximo aceptado en la subida de imágenes. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

/** Extensión con la que se guarda cada MIME aceptado (nunca la del nombre original). */
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const IMAGE_EXTENSION_BY_MIME: Record<AllowedImageMime, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

/**
 * Archivo subido, tal como lo entrega multer. El filtro de multer corta los MIME
 * no permitidos antes de escribir en disco; este esquema declara el contrato.
 */
export const uploadedImageSchema = z.object(
  {
    mimetype: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
      message: 'Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP, GIF)',
    }),
    size: z
      .number({ invalid_type_error: 'Archivo no válido' })
      .int()
      .positive()
      .max(MAX_UPLOAD_BYTES, { message: 'El archivo excede el tamaño máximo permitido de 5MB' }),
  },
  { required_error: 'No se proporcionó ningún archivo de imagen' },
)

export type UploadedImage = z.infer<typeof uploadedImageSchema>
