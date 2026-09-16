import type { Request, Response } from 'express'
import type { IStickerService } from '@/interfaces/sticker.service.interface'
import type {
  CreateStickerInput,
  CreateStickersBulkInput,
  UpdateStickerInput,
} from '@/validations/sticker.schema'
import { asyncHandler } from '@/utils/asyncHandler'
import { sessionUserId } from '@/utils/sessionUser'

export class StickerController {
  constructor(private readonly stickers: IStickerService) {}

  listByAlbum = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.stickers.listByAlbum(Number(req.params.albumId)))
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const sticker = await this.stickers.create(
      Number(req.params.albumId),
      req.body as CreateStickerInput,
      sessionUserId(req),
    )
    res.status(201).json(sticker)
  })

  createBulk = asyncHandler(async (req: Request, res: Response) => {
    const { stickers } = req.body as CreateStickersBulkInput
    const result = await this.stickers.createBulk(
      Number(req.params.albumId),
      stickers,
      sessionUserId(req),
    )
    res.status(201).json(result)
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const sticker = await this.stickers.update(
      Number(req.params.id),
      req.body as UpdateStickerInput,
      sessionUserId(req),
    )
    res.json(sticker)
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.stickers.delete(Number(req.params.id), sessionUserId(req))
    res.status(200).json({ message: 'Lámina eliminada' })
  })
}
