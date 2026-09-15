import type { Request, Response } from 'express'
import { albumService } from '../services/album.service'
import type { CreateAlbumInput, UpdateAlbumInput } from '../validations/album.schema'

export const albumController = {
  async list(_req: Request, res: Response) {
    res.json(await albumService.list())
  },

  async getById(req: Request, res: Response) {
    res.json(await albumService.getById(Number(req.params.id)))
  },

  async create(req: Request, res: Response) {
    const album = await albumService.create({
      ...(req.body as CreateAlbumInput),
      userId: req.session.userId,
    })
    res.status(201).json(album)
  },

  async update(req: Request, res: Response) {
    res.json(
      await albumService.update(
        Number(req.params.id),
        req.body as UpdateAlbumInput,
        req.session.userId,
      ),
    )
  },

  async delete(req: Request, res: Response) {
    await albumService.delete(Number(req.params.id), req.session.userId)
    res.status(200).json({ message: 'Álbum eliminado' })
  },
}
