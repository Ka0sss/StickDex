import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '@/utils/httpError'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return next(new HttpError(401, 'Debes iniciar sesión'))
  }
  next()
}
