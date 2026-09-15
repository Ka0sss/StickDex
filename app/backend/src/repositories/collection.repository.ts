import { prisma } from '../config/prisma'

export const collectionRepository = {
  findById(id: number) {
    return prisma.collection.findUnique({ where: { id } })
  },

  async findMissingStickers(collectionId: number) {
    return prisma.$transaction(async (tx) => {
      const collection = await tx.collection.findUnique({
        where: { id: collectionId },
        include: { stickers: { select: { stickerId: true } } },
      })
      if (!collection) return null

      const ownedIds = new Set(collection.stickers.map((cs) => cs.stickerId))
      const albumStickers = await tx.sticker.findMany({
        where: { albumId: collection.albumId },
        orderBy: { number: 'asc' },
      })
      return albumStickers.filter((sticker) => !ownedIds.has(sticker.id))
    })
  },

  findDuplicatedStickers(collectionId: number) {
    return prisma.collectedSticker.findMany({
      where: { collectionId, quantity: { gt: 1 } },
      include: { sticker: true },
      orderBy: { sticker: { number: 'asc' } },
    })
  },
}
