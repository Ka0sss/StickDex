import { prisma } from '@/config/prisma'
import type { ISessionRepository } from '@/interfaces/session.repository.interface'

export class PrismaSessionRepository implements ISessionRepository {
  find(sid: string) {
    return prisma.session.findUnique({ where: { sid } })
  }

  async save(sid: string, data: string, expiresAt: Date) {
    await prisma.session.upsert({
      where: { sid },
      create: { sid, data, expiresAt },
      update: { data, expiresAt },
    })
  }

  async delete(sid: string) {
    await prisma.session.deleteMany({ where: { sid } })
  }

  async deleteExpired(now: Date) {
    const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lte: now } } })
    return count
  }
}
