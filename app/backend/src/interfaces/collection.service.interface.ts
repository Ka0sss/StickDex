import type { Sticker } from '@prisma/client'
import type {
  CollectedStickerWithSticker,
  CollectionDetail,
  CollectionSummary,
} from '@/interfaces/collection.repository.interface'
import type {
  AddCollectedStickerInput,
  CreateCollectionInput,
  UpdateCollectedStickerInput,
  UpdateCollectionInput,
} from '@/validations/collection.schema'

/** Progreso de una colección: láminas únicas obtenidas frente al total del álbum. */
export type CollectionProgress = {
  collectedCount: number
  totalStickers: number
  percentage: number
}

export type CollectionSummaryView = Omit<CollectionSummary, '_count'> & {
  progress: CollectionProgress
}

export type CollectionDetailView = CollectionDetail & {
  progress: CollectionProgress
}

export type DuplicatedStickerView = {
  stickerId: number
  number: number
  name: string
  imageUrl: string | null
  quantity: number
}

export interface ICollectionService {
  list(query: {
    userId?: number
    isPublic?: boolean
    currentUserId?: number
  }): Promise<CollectionSummaryView[]>
  /** Lanza 403 si la colección es privada y no pertenece al solicitante. */
  getById(id: number, currentUserId?: number): Promise<CollectionDetailView>
  create(data: CreateCollectionInput, userId: number): Promise<CollectionSummaryView>
  update(id: number, data: UpdateCollectionInput, userId: number): Promise<CollectionSummaryView>
  delete(id: number, userId: number): Promise<void>
  addSticker(
    collectionId: number,
    data: AddCollectedStickerInput,
    userId: number,
  ): Promise<CollectedStickerWithSticker>
  updateSticker(
    collectionId: number,
    stickerId: number,
    data: UpdateCollectedStickerInput,
    userId: number,
  ): Promise<CollectedStickerWithSticker>
  removeSticker(collectionId: number, stickerId: number, userId: number): Promise<void>
  missingStickers(collectionId: number, currentUserId?: number): Promise<Sticker[]>
  duplicatedStickers(collectionId: number, currentUserId?: number): Promise<DuplicatedStickerView[]>
}
