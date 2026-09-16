import type { Request } from 'express'
import { HttpError } from './httpError'

/** Id del usuario en sesión; las rutas protegidas ya exigen sesión, esto es defensa extra. */
export function sessionUserId(req: Request): number {
  const userId = req.session.userId
  if (!userId) throw new HttpError(401, 'Debes iniciar sesión')
  return userId
}
