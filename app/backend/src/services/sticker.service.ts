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

  async create(albumId: number, data: StickerData) {
    await albumService.getById(albumId)
    return stickerRepository.create(albumId, data)
  },

  async createBulk(albumId: number, stickers: StickerData[]) {
    await albumService.getById(albumId)
    return stickerRepository.createMany(albumId, stickers)
  },

  async getById(id: number) {
    const sticker = await stickerRepository.findById(id)
    if (!sticker) throw new HttpError(404, 'Lámina no encontrada')
    return sticker
  },

  async update(id: number, data: Partial<StickerData>) {
    await this.getById(id)
    return stickerRepository.update(id, data)
  },

  async delete(id: number) {
    await this.getById(id)
    return stickerRepository.delete(id)
  },
}
