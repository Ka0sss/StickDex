import session from 'express-session'
import type { ISessionRepository } from '@/interfaces/session.repository.interface'

/** Vigencia de la cookie de sesión y de su fila en la base de datos. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Store de sesiones respaldado por MySQL a través de Prisma, para que las
 * sesiones sobrevivan a los reinicios del servidor.
 */
export class PrismaSessionStore extends session.Store {
  constructor(private readonly sessions: ISessionRepository) {
    super()
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void): void {
    this.sessions
      .find(sid)
      .then((row) => {
        if (!row) return callback(null, null)

        if (row.expiresAt.getTime() <= Date.now()) {
          void this.sessions.delete(sid).catch(() => undefined)
          return callback(null, null)
        }

        callback(null, JSON.parse(row.data) as session.SessionData)
      })
      .catch((error: unknown) => callback(error))
  }

  set(sid: string, data: session.SessionData, callback?: (err?: unknown) => void): void {
    const expires = data.cookie?.expires
    const expiresAt = expires ? new Date(expires) : new Date(Date.now() + SESSION_TTL_MS)

    this.sessions
      .save(sid, JSON.stringify(data), expiresAt)
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error))
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    this.sessions
      .delete(sid)
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error))
  }

  touch(sid: string, data: session.SessionData, callback?: (err?: unknown) => void): void {
    this.set(sid, data, callback)
  }

  clear(callback?: (err?: unknown) => void): void {
    this.sessions
      .deleteExpired(new Date())
      .then(() => callback?.())
      .catch((error: unknown) => callback?.(error))
  }
}
