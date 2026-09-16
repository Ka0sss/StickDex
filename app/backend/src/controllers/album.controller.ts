import type { Request, Response } from 'express'
import type { IAlbumService } from '@/interfaces/album.service.interface'
import type { CreateAlbumInput, UpdateAlbumInput } from '@/validations/album.schema'
import { asyncHandler } from '@/utils/asyncHandler'
import { sessionUserId } from '@/utils/sessionUser'

export class AlbumController {
  constructor(private readonly albums: IAlbumService) {}

  list = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await this.albums.list())
  })

  getById = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.albums.getById(Number(req.params.id)))
  })

  create = asyncHandler(async (req: Request, res: Response) => {
    const album = await this.albums.create(req.body as CreateAlbumInput, sessionUserId(req))
    res.status(201).json(album)
  })

  update = asyncHandler(async (req: Request, res: Response) => {
    const album = await this.albums.update(
      Number(req.params.id),
      req.body as UpdateAlbumInput,
      sessionUserId(req),
    )
    res.json(album)
  })

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.albums.delete(Number(req.params.id), sessionUserId(req))
    res.status(200).json({ message: 'Álbum eliminado' })
  })
}
