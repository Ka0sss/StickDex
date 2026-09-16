import type { IAlbumRepository } from '@/interfaces/album.repository.interface'
import type { IAlbumService } from '@/interfaces/album.service.interface'
import type { CreateAlbumInput, UpdateAlbumInput } from '@/validations/album.schema'
import { HttpError } from '@/utils/httpError'
import { assertOwnership } from '@/services/albumAccess'

export class AlbumService implements IAlbumService {
  constructor(private readonly albums: IAlbumRepository) {}

  list() {
    return this.albums.findAll()
  }

  async getById(id: number) {
    const album = await this.albums.findById(id)
    if (!album) throw new HttpError(404, 'Álbum no encontrado')
    return album
  }

  create(data: CreateAlbumInput, userId: number) {
    return this.albums.create({ ...data, userId })
  }

  async update(id: number, data: UpdateAlbumInput, userId: number) {
    const ownership = await this.albums.findOwnership(id)
    if (!ownership) throw new HttpError(404, 'Álbum no encontrado')
    assertOwnership(ownership.userId, userId, 'No tienes permiso para modificar este álbum')
    return this.albums.update(id, data)
  }

  async delete(id: number, userId: number) {
    const ownership = await this.albums.findOwnership(id)
    if (!ownership) throw new HttpError(404, 'Álbum no encontrado')
    assertOwnership(ownership.userId, userId, 'No tienes permiso para eliminar este álbum')
    await this.albums.delete(id)
  }
}
