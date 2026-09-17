import type { Request, Response } from 'express'
import type { IHealthRepository } from '@/interfaces/health.repository.interface'
import { asyncHandler } from '@/utils/asyncHandler'

/**
 * Estado del servicio y de su dependencia crítica (MySQL). Se monta en `/health`,
 * fuera de `/api`, para que lo consulten Docker Compose y cualquier monitorización.
 */
export class HealthController {
  constructor(private readonly health: IHealthRepository) {}

  check = asyncHandler(async (_req: Request, res: Response) => {
    const database = await this.health
      .ping()
      .then(() => 'up' as const)
      .catch(() => 'down' as const)

    if (database === 'down') {
      res.status(503).json({ status: 'error', database })
      return
    }

    res.json({ status: 'ok', database })
  })
}
