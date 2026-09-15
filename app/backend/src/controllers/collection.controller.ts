import type { Request, Response } from 'express'
import { collectionService } from '../services/collection.service'

export const collectionController = {
  async missing(req: Request, res: Response) {
    res.json(await collectionService.missingStickers(Number(req.params.id)))
  },

  async duplicates(req: Request, res: Response) {
    res.json(await collectionService.duplicatedStickers(Number(req.params.id)))
  },
}
