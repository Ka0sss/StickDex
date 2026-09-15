import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { HttpError } from '../utils/httpError'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Entrada inválida',
      details: err.flatten(),
    })
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: 'http_error', message: err.message })
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

  console.error(err)
  return res.status(500).json({ error: 'internal_error', message: 'Error interno del servidor' })
}
