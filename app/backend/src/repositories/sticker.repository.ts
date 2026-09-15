import { prisma } from '../config/prisma'

export const stickerRepository = {
  findByAlbum(albumId: number) {
    return prisma.sticker.findMany({
      where: { albumId },
      orderBy: { number: 'asc' },
    })
  },

  findById(id: number) {
    return prisma.sticker.findUnique({ where: { id } })
  },

  create(
    albumId: number,
    data: { number: number; name: string; imageUrl?: string; type?: string },
  ) {
    return prisma.sticker.create({ data: { ...data, albumId } })
  },

  createMany(
    albumId: number,
    stickers: Array<{ number: number; name: string; imageUrl?: string; type?: string }>,
  ) {
    return prisma.sticker.createMany({
      data: stickers.map((sticker) => ({ ...sticker, albumId })),
    })
  },

  update(
    id: number,
    data: { number?: number; name?: string; imageUrl?: string; type?: string },
  ) {
    return prisma.sticker.update({ where: { id }, data })
  },

  delete(id: number) {
    return prisma.sticker.delete({ where: { id } })
  },
}
