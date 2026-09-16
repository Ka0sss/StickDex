import { describe, expect, it } from 'vitest'
import '@/validations/errorMap'
import { envSchema } from '@/validations/env.schema'
import { failureOf, messagesAt } from './helpers/zod'

const BASE_ENV = {
  DATABASE_URL: 'mysql://stickdex:secreto@localhost:3306/stickdex',
  SESSION_SECRET: 'clave-de-sesion-de-mas-de-32-caracteres',
  PORT: '3000',
}

function parseEnv(overrides: Record<string, string | undefined>) {
  return envSchema.safeParse({ ...BASE_ENV, ...overrides })
}

describe('esquema de entorno', () => {
  it('acepta un entorno completo válido', () => {
    const result = parseEnv({})

    expect(result.success).toBe(true)
    expect(result.success && result.data).toEqual({
      DATABASE_URL: BASE_ENV.DATABASE_URL,
      SESSION_SECRET: BASE_ENV.SESSION_SECRET,
      PORT: 3000,
      NODE_ENV: 'development',
    })
  })

  it('usa el puerto 3000 por defecto cuando PORT no está definida', () => {
    const result = parseEnv({ PORT: undefined })

    expect(result.success && result.data.PORT).toBe(3000)
  })

  it("rechaza PORT='' porque se coacciona a 0", () => {
    const error = failureOf(parseEnv({ PORT: '' }))

    expect(messagesAt(error, 'PORT')).toEqual(['PORT debe estar entre 1 y 65535'])
  })

  it("rechaza PORT='-1' por debajo del rango", () => {
    const error = failureOf(parseEnv({ PORT: '-1' }))

    expect(messagesAt(error, 'PORT')).toEqual(['PORT debe estar entre 1 y 65535'])
  })

  it("rechaza PORT='99999' por encima del rango", () => {
    const error = failureOf(parseEnv({ PORT: '99999' }))

    expect(messagesAt(error, 'PORT')).toEqual(['PORT debe estar entre 1 y 65535'])
  })

  it("rechaza PORT='3000.5' por no ser entero", () => {
    const error = failureOf(parseEnv({ PORT: '3000.5' }))

    expect(messagesAt(error, 'PORT')).toEqual(['PORT debe ser un puerto entero'])
  })

  it("acepta PORT='3000' y lo coacciona a número", () => {
    const result = parseEnv({ PORT: '3000' })

    expect(result.success && result.data.PORT).toBe(3000)
  })

  it("rechaza DATABASE_URL='x' por no ser URL", () => {
    const error = failureOf(parseEnv({ DATABASE_URL: 'x' }))

    expect(messagesAt(error, 'DATABASE_URL')).toContain('DATABASE_URL debe ser una URL válida')
  })

  it('rechaza una DATABASE_URL de PostgreSQL', () => {
    const error = failureOf(parseEnv({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' }))

    expect(messagesAt(error, 'DATABASE_URL')).toEqual([
      'DATABASE_URL debe apuntar a MySQL (mysql://...)',
    ])
  })

  it('exige DATABASE_URL y SESSION_SECRET', () => {
    const error = failureOf(parseEnv({ DATABASE_URL: undefined, SESSION_SECRET: undefined }))

    expect(messagesAt(error, 'DATABASE_URL')).toContain('DATABASE_URL es obligatoria')
    expect(messagesAt(error, 'SESSION_SECRET')).toContain('SESSION_SECRET es obligatoria')
  })

  it('exige un SESSION_SECRET de al menos 32 caracteres', () => {
    const error = failureOf(parseEnv({ SESSION_SECRET: 'corta'.repeat(6) + 'x' }))

    expect(messagesAt(error, 'SESSION_SECRET')).toEqual([
      'SESSION_SECRET debe tener al menos 32 caracteres',
    ])
  })

  it('acepta un SESSION_SECRET de exactamente 32 caracteres', () => {
    const secret = 'a'.repeat(32)
    const result = parseEnv({ SESSION_SECRET: secret })

    expect(result.success && result.data.SESSION_SECRET).toBe(secret)
  })

  it('rechaza un NODE_ENV desconocido', () => {
    const error = failureOf(parseEnv({ NODE_ENV: 'staging' }))

    expect(messagesAt(error, 'NODE_ENV')).toEqual([
      'Valor no permitido. Opciones: development, test, production',
    ])
  })
})
