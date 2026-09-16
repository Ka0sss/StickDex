import { describe, expect, it } from 'vitest'
import type session from 'express-session'
import { PrismaSessionStore, SESSION_TTL_MS } from '@/config/sessionStore'
import { InMemorySessionRepository } from './fakes/sessionRepository.fake'

function read(store: PrismaSessionStore, sid: string) {
  return new Promise<session.SessionData | null | undefined>((resolve, reject) => {
    store.get(sid, (error, data) => {
      if (error) reject(error instanceof Error ? error : new Error(String(error)))
      else resolve(data)
    })
  })
}

function write(store: PrismaSessionStore, sid: string, data: session.SessionData) {
  return new Promise<void>((resolve, reject) => {
    store.set(sid, data, (error) => {
      if (error) reject(error instanceof Error ? error : new Error(String(error)))
      else resolve()
    })
  })
}

describe('PrismaSessionStore', () => {
  it('devuelve los datos de una sesión vigente', async () => {
    const sessions = new InMemorySessionRepository([
      {
        sid: 'vigente',
        data: JSON.stringify({ userId: 7 }),
        expiresAt: new Date(Date.now() + 60_000),
      },
    ])

    const data = await read(new PrismaSessionStore(sessions), 'vigente')

    expect(data).toEqual({ userId: 7 })
  })

  it('ignora y borra una sesión expirada', async () => {
    const sessions = new InMemorySessionRepository([
      {
        sid: 'expirada',
        data: JSON.stringify({ userId: 7 }),
        expiresAt: new Date(Date.now() - 1_000),
      },
    ])

    const data = await read(new PrismaSessionStore(sessions), 'expirada')

    expect(data).toBeNull()
    expect(await sessions.find('expirada')).toBeNull()
  })

  it('guarda la sesión con la caducidad de la cookie', async () => {
    const sessions = new InMemorySessionRepository()
    const store = new PrismaSessionStore(sessions)
    const expires = new Date(Date.now() + 120_000)
    const cookie = { expires } as session.Cookie

    await write(store, 'nueva', { userId: 3, cookie } as session.SessionData)

    const row = await sessions.find('nueva')
    expect(row && JSON.parse(row.data)).toEqual({
      userId: 3,
      cookie: { expires: expires.toISOString() },
    })
    expect(row?.expiresAt).toEqual(expires)
  })

  it('usa la vigencia por defecto cuando la cookie no trae fecha', async () => {
    const sessions = new InMemorySessionRepository()
    const before = Date.now()

    await write(new PrismaSessionStore(sessions), 'nueva', { userId: 3 } as session.SessionData)

    const row = await sessions.find('nueva')
    expect(row && row.expiresAt.getTime() - before).toBeGreaterThanOrEqual(SESSION_TTL_MS)
    expect(row && row.expiresAt.getTime() - before).toBeLessThan(SESSION_TTL_MS + 5_000)
  })

  it('clear borra únicamente las sesiones expiradas', async () => {
    const sessions = new InMemorySessionRepository([
      { sid: 'expirada', data: '{}', expiresAt: new Date(Date.now() - 1_000) },
      { sid: 'vigente', data: '{}', expiresAt: new Date(Date.now() + 60_000) },
    ])
    const store = new PrismaSessionStore(sessions)

    await new Promise<void>((resolve) => store.clear(() => resolve()))

    expect(await sessions.find('expirada')).toBeNull()
    expect(await sessions.find('vigente')).not.toBeNull()
  })

  it('destroy elimina la sesión', async () => {
    const sessions = new InMemorySessionRepository([
      { sid: 'activa', data: '{}', expiresAt: new Date(Date.now() + 60_000) },
    ])
    const store = new PrismaSessionStore(sessions)

    await new Promise<void>((resolve) => store.destroy('activa', () => resolve()))

    expect(await sessions.find('activa')).toBeNull()
  })
})
