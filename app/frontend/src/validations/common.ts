// Espejo de app/backend/src/validations/common.ts: mantén los límites sincronizados.
import { z } from 'zod'

/** Máximo de un INT de MySQL: evita desbordes que Prisma reportaría como error 500. */
export const MAX_INT_32 = 2_147_483_647

/** Id de ruta: solo dígitos decimales, dentro del rango de INT de MySQL. */
export const idParam = z
  .string({ invalid_type_error: 'Debe ser un id numérico' })
  .regex(/^\d+$/, { message: 'Debe ser un id numérico' })
  .transform(Number)
  .refine((value) => value >= 1 && value <= MAX_INT_32, {
    message: `El id debe estar entre 1 y ${MAX_INT_32}`,
  })

/** Entero positivo con cota superior, para ids y contadores del body. */
export const positiveInt = z.number().int().positive().max(MAX_INT_32)

/** Texto obligatorio sin espacios sobrantes. */
export const requiredText = (max: number) =>
  z.string().trim().min(1, { message: 'Este campo es obligatorio' }).max(max)

/** Texto opcional sin espacios sobrantes. */
export const optionalText = (max: number) => z.string().trim().max(max).optional()

/**
 * Imagen: ruta servida por el propio backend (`/uploads/...`) o URL http(s).
 * Rechaza esquemas peligrosos como `javascript:` o `data:`.
 */
export const imageUrlField = z
  .string()
  .trim()
  .max(500)
  .refine((value) => /^\/uploads\/[\w.-]+$/.test(value) || /^https?:\/\//.test(value), {
    message: 'Debe ser una ruta /uploads/... o una URL http(s)',
  })

/** Fecha opcional; acepta `null` explícito para limpiar el valor. */
export const nullableDate = z.union([z.null(), z.coerce.date()])

/** Cuerpo de actualización: exige al menos un campo para no aceptar no-ops. */
export const nonEmptyUpdate = <T extends z.ZodObject<z.ZodRawShape>>(schema: T) =>
  schema.refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  })

/**
 * Primer mensaje por campo (clave = `path.join('.')`) para pintar el error justo
 * debajo del input correspondiente.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!(key in result)) result[key] = issue.message
  }
  return result
}
