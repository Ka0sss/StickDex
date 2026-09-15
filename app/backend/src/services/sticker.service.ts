import { stickerRepository } from '../repositories/sticker.repository'
import { HttpError } from '../utils/httpError'
import { albumService } from './album.service'

type StickerData = {
  number: number
  name: string
  imageUrl?: string
  type?: string
}

export const stickerService = {
  async listByAlbum(albumId: number) {
    await albumService.getById(albumId)
    return stickerRepository.findByAlbum(albumId)
  },

  async create(albumId: number, data: StickerData, currentUserId?: number) {
    const album = await albumService.getById(albumId)
    if (album.userId && currentUserId && album.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para agregar láminas a este álbum')
    }
    return stickerRepository.create(albumId, data)
  },

  async createBulk(albumId: number, stickers: StickerData[], currentUserId?: number) {
    const album = await albumService.getById(albumId)
    if (album.userId && currentUserId && album.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para agregar láminas a este álbum')
    }
    return stickerRepository.createMany(albumId, stickers)
  },

  async getById(id: number) {
    const sticker = await stickerRepository.findById(id)
    if (!sticker) throw new HttpError(404, 'Lámina no encontrada')
    return sticker
  },

  async update(id: number, data: Partial<StickerData>, currentUserId?: number) {
    const sticker = await this.getById(id)
    const album = await albumService.getById(sticker.albumId)
    if (album.userId && currentUserId && album.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para modificar láminas de este álbum')
    }
    return stickerRepository.update(id, data)
  },

  async delete(id: number, currentUserId?: number) {
    const sticker = await this.getById(id)
    const album = await albumService.getById(sticker.albumId)
    if (album.userId && currentUserId && album.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para eliminar láminas de este álbum')
    }
    return stickerRepository.delete(id)
  },
}
