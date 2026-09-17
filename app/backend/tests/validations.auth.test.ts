import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '@/validations/auth.schema'
import '@/validations/errorMap'
import { failureOf, messagesAt } from './helpers/zod'

const VALID_REGISTER = {
  username: 'enrique',
  email: 'enrique@example.com',
  password: 'secreto123',
}

describe('registerSchema', () => {
  it('acepta un registro válido y normaliza username y email', () => {
    const result = registerSchema.safeParse({
      username: '  enrique  ',
      email: '  Enrique@Example.COM ',
      password: 'secreto123',
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data).toEqual({
      username: 'enrique',
      email: 'enrique@example.com',
      password: 'secreto123',
    })
  })

  it('rechaza un email inválido', () => {
    const error = failureOf(registerSchema.safeParse({ ...VALID_REGISTER, email: 'enrique@' }))

    expect(messagesAt(error, 'email')).toContain('Email inválido')
  })

  it('rechaza un username de solo espacios', () => {
    const error = failureOf(registerSchema.safeParse({ ...VALID_REGISTER, username: '     ' }))

    expect(messagesAt(error, 'username')).toContain(
      'El nombre de usuario debe tener al menos 3 caracteres',
    )
  })

  it('rechaza un username con símbolos no permitidos', () => {
    const error = failureOf(registerSchema.safeParse({ ...VALID_REGISTER, username: 'enri#que!' }))

    expect(messagesAt(error, 'username')).toEqual([
      'Solo se permiten letras, números, punto, guion y guion bajo',
    ])
  })

  it('rechaza una contraseña de menos de 8 caracteres', () => {
    const error = failureOf(registerSchema.safeParse({ ...VALID_REGISTER, password: 'corta1' }))

    expect(messagesAt(error, 'password')).toContain(
      'La contraseña debe tener al menos 8 caracteres',
    )
  })

  it('acepta una contraseña de exactamente 72 bytes y rechaza una mayor', () => {
    const maxBytes = 'é'.repeat(36)
    const tooManyBytes = 'é'.repeat(37)

    expect(registerSchema.safeParse({ ...VALID_REGISTER, password: maxBytes }).success).toBe(true)
    const error = failureOf(registerSchema.safeParse({ ...VALID_REGISTER, password: tooManyBytes }))
    expect(messagesAt(error, 'password')).toContain('La contraseña no puede superar 72 bytes')
  })

  it('rechaza 25 caracteres multibyte (75 bytes) porque bcrypt los truncaría', () => {
    const password = '漢'.repeat(25)
    expect(Buffer.byteLength(password, 'utf8')).toBe(75)

    const error = failureOf(registerSchema.safeParse({ ...VALID_REGISTER, password }))

    expect(messagesAt(error, 'password')).toEqual(['La contraseña no puede superar 72 bytes'])
  })
})

describe('loginSchema', () => {
  it('normaliza el email a minúsculas y sin espacios', () => {
    const result = loginSchema.safeParse({
      email: '  USUARIO@Example.COM  ',
      password: 'secreto123',
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.email).toBe('usuario@example.com')
  })

  it('exige contraseña y email válidos', () => {
    const error = failureOf(loginSchema.safeParse({ email: 'no-es-email', password: '' }))

    expect(messagesAt(error, 'email')).toEqual(['Email inválido'])
    expect(messagesAt(error, 'password')).toEqual(['La contraseña es obligatoria'])
  })
})
