import bcrypt from 'bcryptjs'
import { userRepository } from '../repositories/user.repository'
import { HttpError } from '../utils/httpError'

const SALT_ROUNDS = 10

const sanitize = (user: { id: number; username: string; email: string }) => ({
  id: user.id,
  username: user.username,
  email: user.email,
})

export const authService = {
  async register(data: { username: string; email: string; password: string }) {
    if (await userRepository.findByEmail(data.email)) {
      throw new HttpError(409, 'El email ya está registrado')
    }
    if (await userRepository.findByUsername(data.username)) {
      throw new HttpError(409, 'El nombre de usuario ya está en uso')
    }

    const password = await bcrypt.hash(data.password, SALT_ROUNDS)
    const user = await userRepository.create({ ...data, password })
    return sanitize(user)
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new HttpError(401, 'Credenciales inválidas')
    }
    return sanitize(user)
  },

  async me(userId: number) {
    const user = await userRepository.findById(userId)
    if (!user) throw new HttpError(401, 'No autenticado')
    return sanitize(user)
  },
}
