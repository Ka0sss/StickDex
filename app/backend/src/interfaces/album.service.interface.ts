import type { Album } from '@prisma/client'
import type { AlbumWithStickers } from '@/interfaces/album.repository.interface'
import type { CreateAlbumInput, UpdateAlbumInput } from '@/validations/album.schema'

export interface IAlbumService {
  list(): Promise<Album[]>
  /** Lanza 404 si el álbum no existe. */
  getById(id: number): Promise<AlbumWithStickers>
  create(data: CreateAlbumInput, userId: number): Promise<Album>
  /** Lanza 403 si el álbum pertenece a otro usuario. */
  update(id: number, data: UpdateAlbumInput, userId: number): Promise<Album>
  /** Lanza 403 si el álbum pertenece a otro usuario. */
  delete(id: number, userId: number): Promise<void>
}
