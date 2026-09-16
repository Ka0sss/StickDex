import type { Request, Response } from 'express'
import type { ICollectionService } from '@/interfaces/collection.service.interface'
import type {
  AddCollectedStickerInput,
  CreateCollectionInput,
  ListCollectionsQuery,
  UpdateCollectedStickerInput,
  UpdateCollectionInput,
} from '@/validations/collection.schema'
import { asyncHandler } from '@/utils/asyncHandler'
import { sessionUserId } from '@/utils/sessionUser'

export class CollectionController {
  constructor(private readonly collections: ICollectionService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListCollectionsQuery
    res.json(
      await this.collections.list({
        userId: query.userId,
        isPublic: query.isPublic,
        currentUserId: req.session.userId,
      }),
    )
  })

  getById = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.collections.getById(Number(req.params.id), req.session.userId))
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const collection = await this.collections.create(
      req.body as CreateCollectionInput,
      sessionUserId(req),
    )
    res.status(201).json(collection)
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const collection = await this.collections.update(
      Number(req.params.id),
      req.body as UpdateCollectionInput,
      sessionUserId(req),
    )
    res.json(collection)
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.collections.delete(Number(req.params.id), sessionUserId(req))
    res.status(200).json({ message: 'Colección eliminada' })
  })

  addSticker = asyncHandler(async (req: Request, res: Response) => {
    const sticker = await this.collections.addSticker(
      Number(req.params.id),
      req.body as AddCollectedStickerInput,
      sessionUserId(req),
    )
    res.status(201).json(sticker)
  })

  updateSticker = asyncHandler(async (req: Request, res: Response) => {
    const sticker = await this.collections.updateSticker(
      Number(req.params.id),
      Number(req.params.stickerId),
      req.body as UpdateCollectedStickerInput,
      sessionUserId(req),
    )
    res.json(sticker)
  })

  removeSticker = asyncHandler(async (req: Request, res: Response) => {
    await this.collections.removeSticker(
      Number(req.params.id),
      Number(req.params.stickerId),
      sessionUserId(req),
    )
    res.status(200).json({ message: 'Lámina eliminada de la colección' })
  })

  missing = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.collections.missingStickers(Number(req.params.id), req.session.userId))
  })

  duplicates = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.collections.duplicatedStickers(Number(req.params.id), req.session.userId))
  })
}
