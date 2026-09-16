import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { errorHandler } from '@/middlewares/error'
import { HttpError } from '@/utils/httpError'
import { registerSchema } from '@/validations/auth.schema'
import { failureOf } from './helpers/zod'

/** Doble mínimo de `res` que registra el status y el cuerpo enviados. */
type ResponseDouble = {
  status(code: number): ResponseDouble
  json(payload: unknown): ResponseDouble
}

type CapturedResponse = { status: number | null; body: unknown }

function createResponseDouble(): { res: Response; captured: CapturedResponse } {
  const captured: CapturedResponse = { status: null, body: null }
  const res: ResponseDouble = {
    status(code) {
      captured.status = code
      return res
    },
    json(payload) {
      captured.body = payload
      return res
    },
  }
  return { res: res as unknown as Response, captured }
}

function handle(err: unknown) {
  const { res, captured } = createResponseDouble()
  errorHandler(err, {} as Request, res, (() => undefined) as NextFunction)
  return captured
}

describe('errorHandler con HttpError', () => {
  it('traduce 403 al código y status esperados sin details', () => {
    const response = handle(new HttpError(403, 'No tienes permiso'))

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'forbidden', message: 'No tienes permiso' })
  })

  it('incluye details cuando vienen en el error', () => {
    const response = handle(new HttpError(400, 'Entrada inválida', { source: 'body' }))

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: 'bad_request',
      message: 'Entrada inválida',
      details: { source: 'body' },
    })
  })

  it('traduce 404 y 409 a sus códigos', () => {
    expect(handle(new HttpError(404, 'No existe')).body).toMatchObject({ error: 'not_found' })
    expect(handle(new HttpError(409, 'Duplicado')).body).toMatchObject({ error: 'conflict' })
  })
})

describe('errorHandler con ZodError', () => {
  it('responde 400 con los issues de validación', () => {
    const error = failureOf(
      registerSchema.safeParse({ username: 'x', email: 'mal', password: 'corta' }),
    )

    const response = handle(error)

    expect(response.status).toBe(400)
    const body = response.body as {
      error: string
      message: string
      details: { issues: { path: string; message: string }[] }
    }
    expect(body.error).toBe('validation_error')
    expect(body.message).toBe('Entrada inválida')
    expect(body.details.issues.length).toBeGreaterThan(0)
    expect(body.details.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(['username', 'email', 'password']),
    )
    expect(body.details.issues.every((issue) => issue.message.length > 0)).toBe(true)
  })
})

describe('errorHandler con errores de Prisma', () => {
  it('traduce P2002 (restricción única) a 409 con el campo objetivo', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`albumId`,`number`)',
      { code: 'P2002', clientVersion: '6.5.0', meta: { target: ['albumId', 'number'] } },
    )

    const response = handle(error)

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: 'conflict',
      message: 'Ya existe un registro con esos datos',
      details: { target: ['albumId', 'number'] },
    })
  })

  it('traduce P2025 (registro inexistente) a 404', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
      code: 'P2025',
      clientVersion: '6.5.0',
    })

    const response = handle(error)

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: 'not_found', message: 'Recurso no encontrado' })
  })
})

describe('errorHandler con errores desconocidos', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('responde 500 sin filtrar el mensaje original', () => {
    const response = handle(new Error('conexión a MySQL caída'))

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: 'internal_error',
      message: 'Error interno del servidor',
    })
  })

  it('responde 500 también cuando lo lanzado no es un Error', () => {
    expect(handle('boom').status).toBe(500)
  })
})
