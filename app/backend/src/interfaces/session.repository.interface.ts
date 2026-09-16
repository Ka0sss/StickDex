export type StoredSession = {
  sid: string
  data: string
  expiresAt: Date
}

export interface ISessionRepository {
  find(sid: string): Promise<StoredSession | null>
  save(sid: string, data: string, expiresAt: Date): Promise<void>
  delete(sid: string): Promise<void>
  deleteExpired(now: Date): Promise<number>
}
