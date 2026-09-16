import type { IAlbumRepository } from '@/interfaces/album.repository.interface'
import type { IStickerRepository } from '@/interfaces/sticker.repository.interface'
import type { IStickerService } from '@/interfaces/sticker.service.interface'
import type { CreateStickerInput, UpdateStickerInput } from '@/validations/sticker.schema'
import { HttpError } from '@/utils/httpError'
import { assertOwnership } from '@/services/albumAccess'

export class StickerService implements IStickerService {
  constructor(
    private readonly stickers: IStickerRepository,
    private readonly albums: IAlbumRepository,
  ) {}

  async listByAlbum(albumId: number) {
    await this.assertAlbumExists(albumId)
    return this.stickers.findByAlbum(albumId)
  }

  async create(albumId: number, data: CreateStickerInput, userId: number) {
    await this.assertAlbumOwner(
      albumId,
      userId,
      'No tienes permiso para agregar láminas a este álbum',
    )
    return this.stickers.create(albumId, data)
  }

  async createBulk(albumId: number, stickers: CreateStickerInput[], userId: number) {
    await this.assertAlbumOwner(
      albumId,
      userId,
      'No tienes permiso para agregar láminas a este álbum',
    )
    return this.stickers.createMany(albumId, stickers)
  }

  async update(id: number, data: UpdateStickerInput, userId: number) {
    const sticker = await this.getById(id)
    await this.assertAlbumOwner(
      sticker.albumId,
      userId,
      'No tienes permiso para modificar láminas de este álbum',
    )
    return this.stickers.update(id, data)
  }

  async delete(id: number, userId: number) {
    const sticker = await this.getById(id)
    await this.assertAlbumOwner(
      sticker.albumId,
      userId,
      'No tienes permiso para eliminar láminas de este álbum',
    )
    await this.stickers.delete(id)
  }

  private async getById(id: number) {
    const sticker = await this.stickers.findById(id)
    if (!sticker) throw new HttpError(404, 'Lámina no encontrada')
    return sticker
  }

  private async assertAlbumExists(albumId: number) {
    const album = await this.albums.findOwnership(albumId)
    if (!album) throw new HttpError(404, 'Álbum no encontrado')
    return album
  }

  private async assertAlbumOwner(albumId: number, userId: number, message: string) {
    const album = await this.assertAlbumExists(albumId)
    assertOwnership(album.userId, userId, message)
  }
}
