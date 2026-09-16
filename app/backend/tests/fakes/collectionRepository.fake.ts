import type { CollectedSticker, Collection, Sticker } from '@prisma/client'
import type { IAlbumRepository } from '@/interfaces/album.repository.interface'
import type { IStickerRepository } from '@/interfaces/sticker.repository.interface'
import type { IUserRepository } from '@/interfaces/user.repository.interface'
import type {
  CollectedStickerWithSticker,
  CollectionDetail,
  CollectionQueryFilter,
  CollectionSummary,
  CreateCollectionData,
  ICollectionRepository,
  UpdateCollectionData,
} from '@/interfaces/collection.repository.interface'

export type SeedCollected = {
  stickerId: number
  quantity?: number
  isDuplicated?: boolean
}

export type SeedCollection = {
  id?: number
  name: string
  albumId: number
  userId: number
  isPublic?: boolean
  collected?: SeedCollected[]
  createdAt?: Date
}

/**
 * Relaciones del fake: las proyecciones (`album`, `user`, `stickers`) se
 * resuelven contra los repositorios inyectados, igual que un `include` de Prisma.
 */
export type CollectionRelations = {
  albums: IAlbumRepository
  stickers: IStickerRepository
  users: IUserRepository
}

/** Repositorio de colecciones y láminas coleccionadas en memoria. */
export class InMemoryCollectionRepository implements ICollectionRepository {
  private readonly rows = new Map<number, Collection>()
  private readonly collectedByCollection = new Map<number, CollectedSticker[]>()
  private nextId = 1
  private nextCollectedId = 1

  constructor(
    private readonly relations: CollectionRelations,
    seed: SeedCollection[] = [],
  ) {
    for (const [index, collection] of seed.entries()) this.insert(collection, index)
  }

  async findSummaries(filter: CollectionQueryFilter): Promise<CollectionSummary[]> {
    const matched = [...this.rows.values()].filter((row) => {
      if (filter.userId !== undefined && row.userId !== filter.userId) return false
      if (filter.isPublic !== undefined && row.isPublic !== filter.isPublic) return false
      if (filter.visibleTo !== undefined && !(row.isPublic || row.userId === filter.visibleTo)) {
        return false
      }
      return true
    })
    return Promise.all(matched.map((row) => this.toSummary(row)))
  }

  async findById(id: number): Promise<Collection | null> {
    return this.rows.get(id) ?? null
  }

  async findDetailedById(id: number): Promise<CollectionDetail | null> {
    const row = this.rows.get(id)
    return row ? this.toDetail(row) : null
  }

  async create(data: CreateCollectionData): Promise<CollectionSummary> {
    return this.toSummary(this.insert(data))
  }

  async update(id: number, data: UpdateCollectionData): Promise<CollectionSummary> {
    const updated: Collection = { ...this.require(id), ...data }
    this.rows.set(id, updated)
    return this.toSummary(updated)
  }

  async delete(id: number): Promise<Collection> {
    const row = this.require(id)
    this.rows.delete(id)
    this.collectedByCollection.delete(id)
    return row
  }

  async findCollectedSticker(
    collectionId: number,
    stickerId: number,
  ): Promise<CollectedStickerWithSticker | null> {
    const entry = this.findEntry(collectionId, stickerId)
    if (!entry) return null
    return { ...entry, sticker: await this.stickerOf(stickerId) }
  }

  async upsertCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ): Promise<CollectedStickerWithSticker> {
    const existing = this.findEntry(collectionId, stickerId)
    if (existing) {
      existing.quantity = data.quantity
      existing.isDuplicated = data.isDuplicated
    } else {
      this.entriesOf(collectionId).push({
        id: this.nextCollectedId++,
        collectionId,
        stickerId,
        quantity: data.quantity,
        isDuplicated: data.isDuplicated,
      })
    }
    return (await this.findCollectedSticker(collectionId, stickerId)) as CollectedStickerWithSticker
  }

  async updateCollectedSticker(
    collectionId: number,
    stickerId: number,
    data: { quantity: number; isDuplicated: boolean },
  ): Promise<CollectedStickerWithSticker> {
    const entry = this.findEntry(collectionId, stickerId)
    if (!entry) throw new Error(`Lámina ${stickerId} no coleccionada en el fake`)
    entry.quantity = data.quantity
    entry.isDuplicated = data.isDuplicated
    return { ...entry, sticker: await this.stickerOf(stickerId) }
  }

  async removeCollectedSticker(collectionId: number, stickerId: number): Promise<CollectedSticker> {
    const entries = this.entriesOf(collectionId)
    const index = entries.findIndex((entry) => entry.stickerId === stickerId)
    if (index < 0) throw new Error(`Lámina ${stickerId} no coleccionada en el fake`)
    return entries.splice(index, 1)[0]
  }

  async findCollectedStickerIds(collectionId: number): Promise<number[]> {
    return this.entriesOf(collectionId).map((entry) => entry.stickerId)
  }

  async findDuplicated(collectionId: number): Promise<CollectedStickerWithSticker[]> {
    const duplicated = this.entriesOf(collectionId).filter(
      (entry) => entry.quantity > 1 || entry.isDuplicated,
    )
    const withSticker = await Promise.all(
      duplicated.map(async (entry) => ({
        ...entry,
        sticker: await this.stickerOf(entry.stickerId),
      })),
    )
    return withSticker.sort((a, b) => a.sticker.number - b.sticker.number)
  }

  private entriesOf(collectionId: number): CollectedSticker[] {
    const existing = this.collectedByCollection.get(collectionId)
    if (existing) return existing
    const created: CollectedSticker[] = []
    this.collectedByCollection.set(collectionId, created)
    return created
  }

  private findEntry(collectionId: number, stickerId: number): CollectedSticker | undefined {
    return this.entriesOf(collectionId).find((entry) => entry.stickerId === stickerId)
  }

  private async stickerOf(stickerId: number): Promise<Sticker> {
    const sticker = await this.relations.stickers.findById(stickerId)
    if (!sticker) throw new Error(`Lámina ${stickerId} inexistente en el fake`)
    return sticker
  }

  private require(id: number): Collection {
    const row = this.rows.get(id)
    if (!row) throw new Error(`Colección ${id} inexistente en el fake`)
    return row
  }

  private async toSummary(row: Collection): Promise<CollectionSummary> {
    const album = await this.relations.albums.findById(row.albumId)
    const user = await this.relations.users.findById(row.userId)
    if (!album || !user) {
      throw new Error(`Colección ${row.id} apunta a relaciones inexistentes en el fake`)
    }
    return {
      ...row,
      album: {
        id: album.id,
        name: album.name,
        totalStickers: album.totalStickers,
        imageUrl: album.imageUrl,
      },
      user: { id: user.id, username: user.username },
      _count: { stickers: this.entriesOf(row.id).length },
    }
  }

  private async toDetail(row: Collection): Promise<CollectionDetail> {
    const album = await this.relations.albums.findById(row.albumId)
    const user = await this.relations.users.findById(row.userId)
    if (!album || !user) {
      throw new Error(`Colección ${row.id} apunta a relaciones inexistentes en el fake`)
    }
    const stickers = await Promise.all(
      this.entriesOf(row.id).map(async (entry) => ({
        ...entry,
        sticker: await this.stickerOf(entry.stickerId),
      })),
    )
    return {
      ...row,
      album,
      user: { id: user.id, username: user.username },
      stickers: stickers.sort((a, b) => a.sticker.number - b.sticker.number),
    }
  }

  private insert(data: SeedCollection, index = 0): Collection {
    const id = data.id ?? this.nextId
    this.nextId = Math.max(this.nextId, id) + 1
    const row: Collection = {
      id,
      name: data.name,
      isPublic: data.isPublic ?? false,
      userId: data.userId,
      albumId: data.albumId,
      createdAt: data.createdAt ?? new Date(`2026-01-01T00:00:${String(index).padStart(2, '0')}Z`),
    }
    this.rows.set(id, row)
    for (const entry of data.collected ?? []) {
      this.entriesOf(id).push({
        id: this.nextCollectedId++,
        collectionId: id,
        stickerId: entry.stickerId,
        quantity: entry.quantity ?? 1,
        isDuplicated: entry.isDuplicated ?? (entry.quantity ?? 1) > 1,
      })
    }
    return row
  }
}
