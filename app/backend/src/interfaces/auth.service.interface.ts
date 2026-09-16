import type { LoginInput, RegisterInput } from '@/validations/auth.schema'

/** Usuario expuesto por HTTP: nunca incluye el hash de la contraseña. */
export type PublicUser = {
  id: number
  username: string
  email: string
}

export interface IAuthService {
  register(data: RegisterInput): Promise<PublicUser>
  login(data: LoginInput): Promise<PublicUser>
  me(userId: number): Promise<PublicUser>
}
