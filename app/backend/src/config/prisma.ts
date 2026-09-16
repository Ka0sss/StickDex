import { PrismaClient } from '@prisma/client'
import { translatePrismaError } from '@/config/prismaError'

const baseClient = new PrismaClient()

/**
 * Cliente único de la aplicación: cualquier operación que falle por una restricción
 * de la base de datos sale de aquí ya convertida en `HttpError`.
 */
export const prisma = baseClient.$extends({
  query: {
    async $allOperations({ args, query }) {
      try {
        return await query(args)
      } catch (error) {
        throw translatePrismaError(error)
      }
    },
  },
})
