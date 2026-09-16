import { prisma } from '@/config/prisma'
import type { CreateUserData, IUserRepository } from '@/interfaces/user.repository.interface'

export class PrismaUserRepository implements IUserRepository {
  findById(id: number) {
    return prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } })
  }

  create(data: CreateUserData) {
    return prisma.user.create({ data })
  }
}
