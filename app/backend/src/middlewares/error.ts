import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import multer from 'multer'
import { ZodError } from 'zod'
import { HttpError } from '@/utils/httpError'

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  500: 'internal_error',
}

/**
 * Middleware central de errores: toda respuesta de error mantiene la forma
 * `{ error, message, details? }` con el status HTTP correcto.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Entrada inválida',
      details: {
        fieldErrors: err.flatten().fieldErrors,
        issues: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    })
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: CODE_BY_STATUS[err.status] ?? 'http_error',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    })
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'file_too_large',
        message: 'El archivo excede el tamaño máximo permitido de 5MB',
      })
    }
    return res.status(400).json({ error: 'upload_error', message: err.message })
  }

  // Errores de parseo del body (JSON malformado, payload excesivo) lanzados por express.json().
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'bad_request', message: 'JSON malformado' })
  }

  if (err instanceof Error && 'type' in err && err.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ error: 'payload_too_large', message: 'Cuerpo de la petición demasiado grande' })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Restricción única (p. ej. número de lámina repetido dentro de un álbum).
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'conflict',
        message: 'Ya existe un registro con esos datos',
        details: { target: err.meta?.target },
      })
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'conflict',
        message: 'La operación contradice una relación existente',
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'not_found', message: 'Recurso no encontrado' })
    }
  }

  console.error(err)
  return res.status(500).json({ error: 'internal_error', message: 'Error interno del servidor' })
}
