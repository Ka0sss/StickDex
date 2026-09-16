import { beforeEach, describe, expect, it } from 'vitest'
import { AuthService } from '@/services/auth.service'
import { InMemoryUserRepository } from './fakes/userRepository.fake'
import { expectHttpError } from './helpers/http'

const REGISTER = {
  username: 'enrique',
  email: 'enrique@example.com',
  password: 'secreto123',
}

let users: InMemoryUserRepository
let service: AuthService

beforeEach(() => {
  users = new InMemoryUserRepository()
  service = new AuthService(users)
})

describe('AuthService.register', () => {
  it('devuelve el usuario público y guarda la contraseña cifrada', async () => {
    const user = await service.register(REGISTER)

    expect(user).toEqual({ id: 1, username: 'enrique', email: 'enrique@example.com' })
    expect(Object.keys(user).sort()).toEqual(['email', 'id', 'username'])

    const stored = await users.findByEmail(REGISTER.email)
    expect(stored?.password).not.toBe(REGISTER.password)
    expect(stored?.password.length).toBeGreaterThan(0)
  })

  it('permite iniciar sesión con las credenciales recién registradas', async () => {
    await service.register(REGISTER)

    const user = await service.login({ email: REGISTER.email, password: REGISTER.password })

    expect(user.username).toBe('enrique')
  })

  it('devuelve 409 si el email ya está registrado', async () => {
    await service.register(REGISTER)

    await expectHttpError(
      service.register({ ...REGISTER, username: 'otro' }),
      409,
      'El email ya está registrado',
    )
  })

  it('devuelve 409 si el username ya está en uso', async () => {
    await service.register(REGISTER)

    await expectHttpError(
      service.register({ ...REGISTER, email: 'otro@example.com' }),
      409,
      'El nombre de usuario ya está en uso',
    )
  })
})

describe('AuthService.login', () => {
  beforeEach(async () => {
    await service.register(REGISTER)
  })

  it('rechaza con 401 una contraseña incorrecta', async () => {
    await expectHttpError(
      service.login({ email: REGISTER.email, password: 'incorrecta' }),
      401,
      'Credenciales inválidas',
    )
  })

  it('rechaza con 401 un email desconocido', async () => {
    await expectHttpError(
      service.login({ email: 'nadie@example.com', password: REGISTER.password }),
      401,
      'Credenciales inválidas',
    )
  })

  it('devuelve el usuario público sin el hash de la contraseña', async () => {
    const user = await service.login({ email: REGISTER.email, password: REGISTER.password })

    expect(user).toEqual({ id: 1, username: 'enrique', email: 'enrique@example.com' })
    expect(user).not.toHaveProperty('password')
  })
})

describe('AuthService.me', () => {
  it('devuelve el usuario público de la sesión sin contraseña', async () => {
    const created = await service.register(REGISTER)

    const user = await service.me(created.id)

    expect(user).toEqual({ id: created.id, username: 'enrique', email: 'enrique@example.com' })
    expect(user).not.toHaveProperty('password')
  })

  it('devuelve 401 si el usuario de la sesión ya no existe', async () => {
    await expectHttpError(service.me(999), 401, 'No autenticado')
  })
})
