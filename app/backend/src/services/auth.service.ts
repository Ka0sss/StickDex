import bcrypt from 'bcryptjs'
import type { User } from '@prisma/client'
import type { IAuthService, PublicUser } from '@/interfaces/auth.service.interface'
import type { IUserRepository } from '@/interfaces/user.repository.interface'
import type { LoginInput, RegisterInput } from '@/validations/auth.schema'
import { HttpError } from '@/utils/httpError'

const SALT_ROUNDS = 10

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
})

export class AuthService implements IAuthService {
  constructor(private readonly users: IUserRepository) {}

  async register(data: RegisterInput): Promise<PublicUser> {
    if (await this.users.findByEmail(data.email)) {
      throw new HttpError(409, 'El email ya está registrado')
    }
    if (await this.users.findByUsername(data.username)) {
      throw new HttpError(409, 'El nombre de usuario ya está en uso')
    }

    const password = await bcrypt.hash(data.password, SALT_ROUNDS)
    return toPublicUser(await this.users.create({ ...data, password }))
  }

  async login(data: LoginInput): Promise<PublicUser> {
    const user = await this.users.findByEmail(data.email)
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new HttpError(401, 'Credenciales inválidas')
    }
    return toPublicUser(user)
  }

  async me(userId: number): Promise<PublicUser> {
    const user = await this.users.findById(userId)
    if (!user) throw new HttpError(401, 'No autenticado')
    return toPublicUser(user)
  }
}
