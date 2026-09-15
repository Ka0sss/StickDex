import { albumRepository } from '../repositories/album.repository'
import { HttpError } from '../utils/httpError'

type AlbumInput = {
  name: string
  description?: string
  imageUrl?: string
  releaseDate?: Date
  stickerType?: string
  totalStickers: number
  userId?: number
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

  async update(id: number, data: Partial<AlbumInput>, currentUserId?: number) {
    const album = await this.getById(id)
    if (album.userId && currentUserId && album.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para modificar este álbum')
    }
    return albumRepository.update(id, data)
  },

  async delete(id: number, currentUserId?: number) {
    const album = await this.getById(id)
    if (album.userId && currentUserId && album.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para eliminar este álbum')
    }
    return albumRepository.delete(id)
  },
}
