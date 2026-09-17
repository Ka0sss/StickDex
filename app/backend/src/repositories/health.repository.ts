import { prisma } from '@/config/prisma'
import type { IHealthRepository } from '@/interfaces/health.repository.interface'

export class PrismaHealthRepository implements IHealthRepository {
  async ping() {
    await prisma.$queryRaw`SELECT 1`
  }
}
