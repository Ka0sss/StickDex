import type { Request, Response } from 'express'
import { stickerService } from '../services/sticker.service'
import type { CreateStickerInput, UpdateStickerInput } from '../validations/sticker.schema'

export const stickerController = {
  async listByAlbum(req: Request, res: Response) {
    res.json(await stickerService.listByAlbum(Number(req.params.albumId)))
  },

  async create(req: Request, res: Response) {
    const sticker = await stickerService.create(
      Number(req.params.albumId),
      req.body as CreateStickerInput,
    )
    res.status(201).json(sticker)
  },

  async createBulk(req: Request, res: Response) {
    const { stickers } = req.body as { stickers: CreateStickerInput[] }
    const result = await stickerService.createBulk(Number(req.params.albumId), stickers)
    res.status(201).json(result)
  },

  async update(req: Request, res: Response) {
    res.json(await stickerService.update(Number(req.params.id), req.body as UpdateStickerInput))
  },

  async delete(req: Request, res: Response) {
    await stickerService.delete(Number(req.params.id))
    res.status(200).json({ message: 'Lámina eliminada' })
  },
}
