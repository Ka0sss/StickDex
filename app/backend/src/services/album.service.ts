import { albumRepository } from '../repositories/album.repository'
import { HttpError } from '../utils/httpError'

type AlbumInput = {
  name: string
  description?: string
  imageUrl?: string
  releaseDate?: Date
  stickerType?: string
  totalStickers: number
}

export const albumService = {
  list() {
    return albumRepository.findAll()
  },

  async getById(id: number) {
    const album = await albumRepository.findById(id)
    if (!album) throw new HttpError(404, 'Álbum no encontrado')
    return album
  },

  create(data: AlbumInput) {
    return albumRepository.create(data)
  },

  async update(id: number, data: Partial<AlbumInput>) {
    await this.getById(id)
    return albumRepository.update(id, data)
  },

  async delete(id: number) {
    await this.getById(id)
    return albumRepository.delete(id)
  },
}
