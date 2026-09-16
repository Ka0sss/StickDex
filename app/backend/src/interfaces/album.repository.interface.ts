import type { Album, Prisma } from '@prisma/client'

export type AlbumWithStickers = Prisma.AlbumGetPayload<{ include: { stickers: true } }>

export type CreateAlbumData = {
  name: string
  description?: string
  imageUrl?: string
  releaseDate?: Date | null
  stickerType?: string
  totalStickers: number
  userId?: number
}

export type UpdateAlbumData = {
  name?: string
  description?: string
  imageUrl?: string
  releaseDate?: Date | null
  stickerType?: string
  totalStickers?: number
}

export interface IAlbumRepository {
  findAll(): Promise<Album[]>
  findById(id: number): Promise<AlbumWithStickers | null>
  /** Consulta ligera para autorización: solo el dueño del álbum. */
  findOwnership(id: number): Promise<{ userId: number | null } | null>
  create(data: CreateAlbumData): Promise<Album>
  update(id: number, data: UpdateAlbumData): Promise<Album>
  delete(id: number): Promise<Album>
}
