import { prisma } from '@/config/prisma'
import type {
  CreateStickerData,
  IStickerRepository,
  UpdateStickerData,
} from '@/interfaces/sticker.repository.interface'

export class PrismaStickerRepository implements IStickerRepository {
  findByAlbum(albumId: number) {
    return prisma.sticker.findMany({
      where: { albumId },
      orderBy: { number: 'asc' },
    })
  }

  findById(id: number) {
    return prisma.sticker.findUnique({ where: { id } })
  }

  create(albumId: number, data: CreateStickerData) {
    return prisma.sticker.create({ data: { ...data, albumId } })
  }

  createMany(albumId: number, stickers: CreateStickerData[]) {
    return prisma.sticker.createMany({
      data: stickers.map((sticker) => ({ ...sticker, albumId })),
    })
  }

  update(id: number, data: UpdateStickerData) {
    return prisma.sticker.update({ where: { id }, data })
  }

  delete(id: number) {
    return prisma.sticker.delete({ where: { id } })
  }
}
