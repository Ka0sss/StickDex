import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'
import { Prisma } from '@prisma/client'
import { translatePrismaError } from '@/config/prismaError'
import { errorHandler } from '@/middlewares/error'
import { validate, type ValidationSource } from '@/middlewares/validate'
import { HttpError } from '@/utils/httpError'
import { registerSchema } from '@/validations/auth.schema'
import { uploadedImageSchema } from '@/validations/upload.schema'

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

describe('validate + errorHandler', () => {
  function runValidate(schema: ZodTypeAny, source: ValidationSource, req: Request) {
    let forwarded: unknown = null
    validate(schema, source)(
      req,
      {} as Response,
      ((err?: unknown) => {
        forwarded = err ?? null
      }) as NextFunction,
    )
    return forwarded
  }

  it('convierte un body inválido en 400 con source, fieldErrors e issues', () => {
    const req = { body: { username: 'x', email: 'mal', password: 'corta' } } as unknown as Request

    const response = handle(runValidate(registerSchema, 'body', req))

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      error: 'bad_request',
      message: 'Entrada inválida',
      details: {
        source: 'body',
        fieldErrors: {
          username: expect.arrayContaining([expect.any(String)]),
          email: expect.arrayContaining([expect.any(String)]),
          password: expect.arrayContaining([expect.any(String)]),
        },
        issues: expect.arrayContaining([{ path: 'email', message: expect.any(String) }]),
      },
    })
  })

  it('reemplaza la fuente por el resultado del parseo (trim y normalización)', () => {
    const req = {
      body: { username: '  bob  ', email: ' BOB@mail.com ', password: 'secreto123' },
    } as unknown as Request

    expect(runValidate(registerSchema, 'body', req)).toBeNull()
    expect(req.body).toEqual({ username: 'bob', email: 'bob@mail.com', password: 'secreto123' })
  })

  it('valida el archivo subido sin reemplazarlo (conserva filename y path)', () => {
    const file = { mimetype: 'image/png', size: 12, filename: 'x.png', path: '/tmp/x.png' }
    const req = { file } as unknown as Request

    expect(runValidate(uploadedImageSchema, 'file', req)).toBeNull()
    expect(req.file).toBe(file)
  })

  it('rechaza un archivo ausente o con MIME no permitido', () => {
    const missing = handle(runValidate(uploadedImageSchema, 'file', {} as Request))
    expect(missing.status).toBe(400)

    const notAllowed = handle(
      runValidate(uploadedImageSchema, 'file', {
        file: { mimetype: 'text/html', size: 12, filename: 'x.html', path: '/tmp/x.html' },
      } as unknown as Request),
    )
    expect(notAllowed.status).toBe(400)
    expect(notAllowed.body).toMatchObject({ details: { source: 'file' } })
  })
})

describe('translatePrismaError', () => {
  const knownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('fallo de restricción', {
      code,
      clientVersion: '6.5.0',
    })

  it('traduce la restricción única (P2002) a 409', () => {
    const response = handle(translatePrismaError(knownError('P2002')))

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: 'conflict',
      message: 'Ya existe un registro con esos datos',
    })
  })

  it('traduce P2003 a 409 y P2025 a 404', () => {
    expect(handle(translatePrismaError(knownError('P2003'))).status).toBe(409)
    expect(handle(translatePrismaError(knownError('P2025'))).status).toBe(404)
  })

  it('deja pasar cualquier otro error sin tocarlo', () => {
    const error = new Error('conexión caída')

    expect(translatePrismaError(error)).toBe(error)
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
