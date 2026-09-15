import { prisma } from '../config/prisma'

export const collectionRepository = {
  findAll(where?: { userId?: number; isPublic?: boolean }) {
    return prisma.collection.findMany({
      where,
      include: {
        album: { select: { id: true, name: true, totalStickers: true, imageUrl: true } },
        user: { select: { id: true, username: true } },
        _count: { select: { stickers: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  findById(id: number) {
    return prisma.collection.findUnique({ where: { id } })
  },

  findDetailedById(id: number) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        album: true,
        user: { select: { id: true, username: true } },
        stickers: {
          include: { sticker: true },
          orderBy: { sticker: { number: 'asc' } },
        },
      },
    })
  },

  create(data: { name: string; albumId: number; userId: number; isPublic?: boolean }) {
    return prisma.collection.create({ data })
  },

  update(id: number, data: { name?: string; isPublic?: boolean }) {
    return prisma.collection.update({ where: { id }, data })
  },

  delete(id: number) {
    return prisma.collection.delete({ where: { id } })
  },

  findCollectedSticker(collectionId: number, stickerId: number) {
    return prisma.collectedSticker.findUnique({
      where: {
        collectionId_stickerId: { collectionId, stickerId },
      },
    })
  },

  upsertCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ) {
    return prisma.collectedSticker.upsert({
      where: {
        collectionId_stickerId: { collectionId, stickerId },
      },
      create: {
        collectionId,
        stickerId,
        quantity: data.quantity,
        isDuplicated: data.isDuplicated,
      },
      update: {
        quantity: data.quantity,
        isDuplicated: data.isDuplicated,
      },
      include: { sticker: true },
    })
  },

  updateCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity?: number; isDuplicated?: boolean },
  ) {
    return prisma.collectedSticker.update({
      where: {
        collectionId_stickerId: { collectionId, stickerId },
      },
      data,
      include: { sticker: true },
    })
  },

  removeCollectedSticker(collectionId: number, stickerId: number) {
    return prisma.collectedSticker.delete({
      where: {
        collectionId_stickerId: { collectionId, stickerId },
      },
    })
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
