import type { ZodError } from 'zod'

/** Mensajes de error registrados para una ruta concreta (`path` unido por puntos). */
export function messagesAt(error: ZodError, path: string): string[] {
  return error.issues.filter((issue) => issue.path.join('.') === path).map((issue) => issue.message)
}

/** Convierte un resultado fallido en su `ZodError`, asegurando que realmente falló. */
export function failureOf<T>(
  result: { success: true; data: T } | { success: false; error: ZodError },
): ZodError {
  if (result.success) {
    throw new Error('Se esperaba un resultado inválido, pero el esquema aceptó la entrada')
  }
  return result.error
}
