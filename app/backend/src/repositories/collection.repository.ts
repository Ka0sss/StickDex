import { prisma } from '@/config/prisma'
import type { Prisma } from '@prisma/client'
import type {
  CollectionQueryFilter,
  CreateCollectionData,
  ICollectionRepository,
  UpdateCollectionData,
} from '@/interfaces/collection.repository.interface'

const SUMMARY_INCLUDE = {
  album: { select: { id: true, name: true, totalStickers: true, imageUrl: true } },
  user: { select: { id: true, username: true } },
  _count: { select: { stickers: true } },
} as const

const DETAIL_INCLUDE = {
  album: true,
  user: { select: { id: true, username: true } },
  stickers: { include: { sticker: true }, orderBy: { sticker: { number: 'asc' } } },
} as const

export class PrismaCollectionRepository implements ICollectionRepository {
  findSummaries(filter: CollectionQueryFilter) {
    const where: Prisma.CollectionWhereInput = {}

    if (filter.userId !== undefined) where.userId = filter.userId
    if (filter.isPublic !== undefined) where.isPublic = filter.isPublic
    if (filter.visibleTo !== undefined) {
      where.OR = [{ isPublic: true }, { userId: filter.visibleTo }]
    }

    return prisma.collection.findMany({
      where,
      include: SUMMARY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
  }

  findById(id: number) {
    return prisma.collection.findUnique({ where: { id } })
  }

  findDetailedById(id: number) {
    return prisma.collection.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    })
  }

  create(data: CreateCollectionData) {
    return prisma.collection.create({ data, include: SUMMARY_INCLUDE })
  }

  update(id: number, data: UpdateCollectionData) {
    return prisma.collection.update({ where: { id }, data, include: SUMMARY_INCLUDE })
  }

  delete(id: number) {
    return prisma.collection.delete({ where: { id } })
  }

  findCollectedSticker(collectionId: number, stickerId: number) {
    return prisma.collectedSticker.findUnique({
      where: { collectionId_stickerId: { collectionId, stickerId } },
      include: { sticker: true },
    })
  }

  upsertCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ) {
    return prisma.collectedSticker.upsert({
      where: { collectionId_stickerId: { collectionId, stickerId } },
      create: { collectionId, stickerId, quantity: data.quantity, isDuplicated: data.isDuplicated },
      update: { quantity: data.quantity, isDuplicated: data.isDuplicated },
      include: { sticker: true },
    })
  }

  updateCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ) {
    return prisma.collectedSticker.update({
      where: { collectionId_stickerId: { collectionId, stickerId } },
      data,
      include: { sticker: true },
    })
  }

  removeCollectedSticker(collectionId: number, stickerId: number) {
    return prisma.collectedSticker.delete({
      where: { collectionId_stickerId: { collectionId, stickerId } },
    })
  }

  async findCollectedStickerIds(collectionId: number) {
    const rows = await prisma.collectedSticker.findMany({
      where: { collectionId },
      select: { stickerId: true },
    })
    return rows.map((row) => row.stickerId)
  }

  findDuplicated(collectionId: number) {
    return prisma.collectedSticker.findMany({
      where: {
        collectionId,
        OR: [{ quantity: { gt: 1 } }, { isDuplicated: true }],
      },
      include: { sticker: true },
      orderBy: { sticker: { number: 'asc' } },
    })
  }
}
