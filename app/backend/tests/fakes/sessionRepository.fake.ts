import type { ISessionRepository, StoredSession } from '@/interfaces/session.repository.interface'

/** Repositorio de sesiones en memoria; sirve para probar el store sin MySQL. */
export class InMemorySessionRepository implements ISessionRepository {
  private readonly rows = new Map<string, StoredSession>()

  constructor(seed: StoredSession[] = []) {
    for (const session of seed) this.rows.set(session.sid, session)
  }

  async find(sid: string): Promise<StoredSession | null> {
    return this.rows.get(sid) ?? null
  }

  async save(sid: string, data: string, expiresAt: Date): Promise<void> {
    this.rows.set(sid, { sid, data, expiresAt })
  }

  async delete(sid: string): Promise<void> {
    this.rows.delete(sid)
  }

  async deleteExpired(now: Date): Promise<number> {
    let removed = 0
    for (const [sid, row] of this.rows) {
      if (row.expiresAt.getTime() <= now.getTime()) {
        this.rows.delete(sid)
        removed += 1
      }
    }
    return removed
  }
}
