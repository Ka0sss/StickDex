import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { HttpError } from '@/utils/httpError'

const CODE_BY_STATUS: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  500: 'internal_error',
}

/**
 * Middleware central de errores: toda respuesta de error mantiene la forma
 * `{ error, message, details? }` con el status HTTP correcto.
 *
 * Los errores de Prisma los traduce `config/prisma.ts` antes de llegar aquí.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
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

  console.error(err)
  return res.status(500).json({ error: 'internal_error', message: 'Error interno del servidor' })
}
