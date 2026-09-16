import type { Request, Response } from 'express'

/** Respuesta estandarizada para rutas inexistentes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found', message: 'Ruta no encontrada' })
}
