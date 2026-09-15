import { prisma } from '../config/prisma'

export const userRepository = {
  findById(id: number) {
    return prisma.user.findUnique({ where: { id } })
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } })
  },

  create(data: { username: string; email: string; password: string }) {
    return prisma.user.create({ data })
  },
}
