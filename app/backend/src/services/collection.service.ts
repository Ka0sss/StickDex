import type {
  CollectionQueryFilter,
  CollectionSummary,
  ICollectionRepository,
} from '@/interfaces/collection.repository.interface'
import type { IAlbumRepository } from '@/interfaces/album.repository.interface'
import type { IStickerRepository } from '@/interfaces/sticker.repository.interface'
import type { IUserRepository } from '@/interfaces/user.repository.interface'
import type {
  CollectionDetailView,
  CollectionProgress,
  CollectionSummaryView,
  DuplicatedStickerView,
  ICollectionService,
  ListCollectionsInput,
} from '../interfaces/collection.service.interface'
import type {
  AddCollectedStickerInput,
  CreateCollectionInput,
  UpdateCollectedStickerInput,
  UpdateCollectionInput,
} from '@/validations/collection.schema'
import { HttpError } from '@/utils/httpError'
import { assertOwnership } from '@/services/albumAccess'

/** Láminas únicas obtenidas frente al total declarado por el álbum. */
export function computeProgress(collectedCount: number, totalStickers: number): CollectionProgress {
  return {
    collectedCount,
    totalStickers,
    percentage: totalStickers > 0 ? Math.round((collectedCount / totalStickers) * 100) : 0,
  }
}

const toSummaryView = (row: CollectionSummary): CollectionSummaryView => {
  const { _count, ...collection } = row
  return { ...collection, progress: computeProgress(_count.stickers, row.album.totalStickers) }
}

export class CollectionService implements ICollectionService {
  constructor(
    private readonly collections: ICollectionRepository,
    private readonly stickers: IStickerRepository,
    private readonly albums: IAlbumRepository,
    private readonly users: IUserRepository,
  ) {}

  async list(query: ListCollectionsInput): Promise<CollectionSummaryView[]> {
    const filter = this.buildQueryFilter(query)
    if (!filter) return []

    const rows = await this.collections.findSummaries(filter)
    return rows.map(toSummaryView)
  }

  async getById(id: number, currentUserId?: number): Promise<CollectionDetailView> {
    const collection = await this.findVisible(id, currentUserId)
    const detailed = await this.collections.findDetailedById(collection.id)
    if (!detailed) throw new HttpError(404, 'Colección no encontrada')

    return {
      ...detailed,
      progress: computeProgress(detailed.stickers.length, detailed.album.totalStickers),
    }
  }

  async create(data: CreateCollectionInput, userId: number): Promise<CollectionSummaryView> {
    if (!(await this.albums.findOwnership(data.albumId))) {
      throw new HttpError(404, 'Álbum no encontrado')
    }
    if (!(await this.users.findById(userId))) {
      throw new HttpError(404, 'Usuario no encontrado')
    }

    const created = await this.collections.create({
      name: data.name,
      albumId: data.albumId,
      userId,
      isPublic: data.isPublic,
    })
    return toSummaryView(created)
  }

  async update(
    id: number,
    data: UpdateCollectionInput,
    userId: number,
  ): Promise<CollectionSummaryView> {
    await this.findOwned(id, userId, 'No tienes permiso para modificar esta colección')
    return toSummaryView(await this.collections.update(id, data))
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.findOwned(id, userId, 'No tienes permiso para eliminar esta colección')
    await this.collections.delete(id)
  }

  async addSticker(collectionId: number, data: AddCollectedStickerInput, userId: number) {
    const collection = await this.findOwned(
      collectionId,
      userId,
      'No tienes permiso para agregar láminas a esta colección',
    )

    const sticker = await this.stickers.findById(data.stickerId)
    if (!sticker) throw new HttpError(404, 'Lámina no encontrada')
    if (sticker.albumId !== collection.albumId) {
      throw new HttpError(400, 'La lámina no pertenece al álbum de esta colección')
    }

    const existing = await this.collections.findCollectedSticker(collectionId, data.stickerId)
    const quantity = data.quantity ?? (existing ? existing.quantity + 1 : 1)
    const isDuplicated = data.isDuplicated ?? quantity > 1

    return this.collections.upsertCollectedSticker(collectionId, data.stickerId, {
      quantity,
      isDuplicated,
    })
  }

  async updateSticker(
    collectionId: number,
    stickerId: number,
    data: UpdateCollectedStickerInput,
    userId: number,
  ) {
    await this.findOwned(
      collectionId,
      userId,
      'No tienes permiso para modificar láminas de esta colección',
    )

    const existing = await this.collections.findCollectedSticker(collectionId, stickerId)
    if (!existing) throw new HttpError(404, 'Lámina no encontrada en esta colección')

    const quantity = data.quantity ?? existing.quantity
    const isDuplicated = data.isDuplicated ?? quantity > 1

    return this.collections.updateCollectedSticker(collectionId, stickerId, {
      quantity,
      isDuplicated,
    })
  }

  async removeSticker(collectionId: number, stickerId: number, userId: number): Promise<void> {
    await this.findOwned(
      collectionId,
      userId,
      'No tienes permiso para eliminar láminas de esta colección',
    )

    const existing = await this.collections.findCollectedSticker(collectionId, stickerId)
    if (!existing) throw new HttpError(404, 'Lámina no encontrada en esta colección')

    await this.collections.removeCollectedSticker(collectionId, stickerId)
  }

  async missingStickers(collectionId: number, currentUserId?: number) {
    const collection = await this.findVisible(collectionId, currentUserId)
    const [albumStickers, collectedIds] = await Promise.all([
      this.stickers.findByAlbum(collection.albumId),
      this.collections.findCollectedStickerIds(collectionId),
    ])

    const owned = new Set(collectedIds)
    return albumStickers.filter((sticker) => !owned.has(sticker.id))
  }

  async duplicatedStickers(
    collectionId: number,
    currentUserId?: number,
  ): Promise<DuplicatedStickerView[]> {
    await this.findVisible(collectionId, currentUserId)
    const rows = await this.collections.findDuplicated(collectionId)

    return rows.map(({ sticker, quantity }) => ({
      stickerId: sticker.id,
      number: sticker.number,
      name: sticker.name,
      imageUrl: sticker.imageUrl,
      quantity,
    }))
  }

  private buildQueryFilter(query: ListCollectionsInput): CollectionQueryFilter | null {
    const isOwnerScope = query.userId !== undefined && query.currentUserId === query.userId

    // Solo el dueño puede listar sus colecciones privadas: para el resto no hay resultados.
    if (query.isPublic === false && !isOwnerScope) return null

    if (query.userId !== undefined) {
      if (isOwnerScope && query.isPublic === undefined) return { userId: query.userId }
      return { userId: query.userId, isPublic: isOwnerScope ? query.isPublic : true }
    }

    if (query.currentUserId !== undefined) return { visibleTo: query.currentUserId }
    return { isPublic: true }
  }

  /** Colección privada visible solo para su dueño. */
  private async findVisible(id: number, currentUserId?: number) {
    const collection = await this.collections.findById(id)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')
    if (!collection.isPublic && collection.userId !== currentUserId) {
      throw new HttpError(403, 'Esta colección es privada')
    }
    return collection
  }

  /** Colección que el usuario puede mutar (solo su dueño). */
  private async findOwned(id: number, userId: number, message: string) {
    const collection = await this.collections.findById(id)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')
    assertOwnership(collection.userId, userId, message)
    return collection
  }
}
