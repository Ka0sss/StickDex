import type { Prisma, Sticker } from '@prisma/client'

export type CreateStickerData = {
  number: number
  name: string
  imageUrl?: string
  type?: string
}

export type UpdateStickerData = Partial<CreateStickerData>

export type CreateManyResult = Prisma.BatchPayload

export interface IStickerRepository {
  findByAlbum(albumId: number): Promise<Sticker[]>
  findById(id: number): Promise<Sticker | null>
  create(albumId: number, data: CreateStickerData): Promise<Sticker>
  createMany(albumId: number, stickers: CreateStickerData[]): Promise<CreateManyResult>
  update(id: number, data: UpdateStickerData): Promise<Sticker>
  delete(id: number): Promise<Sticker>
}
