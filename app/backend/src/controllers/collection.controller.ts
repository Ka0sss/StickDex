import type { Request, Response } from 'express'
import { collectionService } from '../services/collection.service'
import { HttpError } from '../utils/httpError'
import type {
  AddCollectedStickerInput,
  CreateCollectionInput,
  UpdateCollectedStickerInput,
  UpdateCollectionInput,
} from '../validations/collection.schema'

export const collectionController = {
  async list(req: Request, res: Response) {
    const userId = req.query.userId ? Number(req.query.userId) : undefined
    const isPublic = req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined
    res.json(await collectionService.list({ userId, isPublic }))
  },

  async getById(req: Request, res: Response) {
    res.json(await collectionService.getById(Number(req.params.id)))
  },

  async create(req: Request, res: Response) {
    const body = req.body as CreateCollectionInput
    const userId = req.session.userId ?? body.userId

    if (!userId) {
      throw new HttpError(401, 'Debes iniciar sesión para crear una colección')
    }

    const collection = await collectionService.create({
      name: body.name,
      albumId: body.albumId,
      userId,
      isPublic: body.isPublic,
    })
    res.status(201).json(collection)
  },

  async update(req: Request, res: Response) {
    res.json(await collectionService.update(Number(req.params.id), req.body as UpdateCollectionInput))
  },

  async delete(req: Request, res: Response) {
    await collectionService.delete(Number(req.params.id))
    res.status(200).json({ message: 'Colección eliminada' })
  },

  async addSticker(req: Request, res: Response) {
    const sticker = await collectionService.addSticker(
      Number(req.params.id),
      req.body as AddCollectedStickerInput,
    )
    res.status(201).json(sticker)
  },

  async updateSticker(req: Request, res: Response) {
    const sticker = await collectionService.updateSticker(
      Number(req.params.id),
      Number(req.params.stickerId),
      req.body as UpdateCollectedStickerInput,
    )
    res.json(sticker)
  },

  async removeSticker(req: Request, res: Response) {
    await collectionService.removeSticker(
      Number(req.params.id),
      Number(req.params.stickerId),
    )
    res.status(200).json({ message: 'Lámina eliminada de la colección' })
  },

  async missing(req: Request, res: Response) {
    res.json(await collectionService.missingStickers(Number(req.params.id)))
  },

  async duplicates(req: Request, res: Response) {
    res.json(await collectionService.duplicatedStickers(Number(req.params.id)))
  },
}
