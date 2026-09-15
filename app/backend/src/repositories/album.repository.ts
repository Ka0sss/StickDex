import { prisma } from '../config/prisma'

export const albumRepository = {
  findAll() {
    return prisma.album.findMany({ orderBy: { createdAt: 'desc' } })
  },

  findById(id: number) {
    return prisma.album.findUnique({
      where: { id },
      include: { stickers: { orderBy: { number: 'asc' } } },
    })
  },

  create(data: {
    name: string
    description?: string
    imageUrl?: string
    releaseDate?: Date
    stickerType?: string
    totalStickers: number
  }) {
    return prisma.album.create({ data })
  },

  update(
    id: number,
    data: {
      name?: string
      description?: string
      imageUrl?: string
      releaseDate?: Date
      stickerType?: string
      totalStickers?: number
    },
  ) {
    return prisma.album.update({ where: { id }, data })
  },

  delete(id: number) {
    return prisma.album.delete({ where: { id } })
  },
}
