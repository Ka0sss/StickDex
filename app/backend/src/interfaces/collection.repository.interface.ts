import type { CollectedSticker, Collection, Prisma } from '@prisma/client'

/**
 * Filtro de consulta de colecciones. Es la implementación quien traduce estos
 * datos a Prisma; el servicio decide qué combinación aplica según quién consulta.
 */
export type CollectionQueryFilter = {
  /** Colecciones de un usuario concreto. */
  userId?: number
  /** Restringe por visibilidad. */
  isPublic?: boolean
  /** Incluye las públicas y las privadas del usuario indicado. */
  visibleTo?: number
}

export type CollectionSummary = Prisma.CollectionGetPayload<{
  include: {
    album: { select: { id: true; name: true; totalStickers: true; imageUrl: true } }
    user: { select: { id: true; username: true } }
    _count: { select: { stickers: true } }
  }
}>

export type CollectionDetail = Prisma.CollectionGetPayload<{
  include: {
    album: true
    user: { select: { id: true; username: true } }
    stickers: { include: { sticker: true } }
  }
}>

export type CollectedStickerWithSticker = Prisma.CollectedStickerGetPayload<{
  include: { sticker: true }
}>

export type CreateCollectionData = {
  name: string
  albumId: number
  userId: number
  isPublic: boolean
}

export type UpdateCollectionData = {
  name?: string
  isPublic?: boolean
}

export interface ICollectionRepository {
  findSummaries(filter: CollectionQueryFilter): Promise<CollectionSummary[]>
  findById(id: number): Promise<Collection | null>
  findDetailedById(id: number): Promise<CollectionDetail | null>
  create(data: CreateCollectionData): Promise<CollectionSummary>
  update(id: number, data: UpdateCollectionData): Promise<CollectionSummary>
  delete(id: number): Promise<Collection>
  findCollectedSticker(
    collectionId: number,
    stickerId: number,
  ): Promise<CollectedStickerWithSticker | null>
  upsertCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ): Promise<CollectedStickerWithSticker>
  updateCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ): Promise<CollectedStickerWithSticker>
  removeCollectedSticker(collectionId: number, stickerId: number): Promise<CollectedSticker>
  findCollectedStickerIds(collectionId: number): Promise<number[]>
  findDuplicated(collectionId: number): Promise<CollectedStickerWithSticker[]>
}
