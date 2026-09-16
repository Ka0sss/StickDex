import { Prisma } from '@prisma/client'
import { HttpError } from '@/utils/httpError'

/**
 * Traduce los errores conocidos de Prisma a errores de la aplicación, para que
 * ninguna capa fuera de la infraestructura de datos conozca los códigos del driver.
 */
export function translatePrismaError(error: unknown): unknown {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error

  // Restricción única (p. ej. número de lámina repetido dentro de un álbum).
  if (error.code === 'P2002') return new HttpError(409, 'Ya existe un registro con esos datos')
  if (error.code === 'P2003') {
    return new HttpError(409, 'La operación contradice una relación existente')
  }
  if (error.code === 'P2025') return new HttpError(404, 'Recurso no encontrado')

  return error
}
