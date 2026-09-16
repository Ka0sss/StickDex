import type { User } from '@prisma/client'

export type CreateUserData = {
  username: string
  email: string
  password: string
}

export interface IUserRepository {
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  create(data: CreateUserData): Promise<User>
}
