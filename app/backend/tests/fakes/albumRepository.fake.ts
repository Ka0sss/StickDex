import type { Album, Sticker } from '@prisma/client'
import type {
  AlbumWithStickers,
  CreateAlbumData,
  IAlbumRepository,
  UpdateAlbumData,
} from '@/interfaces/album.repository.interface'

export type SeedAlbum = {
  id?: number
  name: string
  totalStickers: number
  /** `null` modela un álbum sin dueño (no mutable por nadie). */
  userId?: number | null
  description?: string | null
  imageUrl?: string | null
  releaseDate?: Date | null
  stickerType?: string | null
  stickers?: Sticker[]
  createdAt?: Date
}

/** Repositorio de álbumes en memoria; `findById` resuelve las láminas del seed. */
export class InMemoryAlbumRepository implements IAlbumRepository {
  private readonly rows = new Map<number, Album>()
  private readonly stickersByAlbum = new Map<number, Sticker[]>()
  private nextId = 1

  constructor(seed: SeedAlbum[] = []) {
    for (const [index, album] of seed.entries()) this.insert(album, index)
  }

  async findAll(): Promise<Album[]> {
    return [...this.rows.values()]
  }

  async findById(id: number): Promise<AlbumWithStickers | null> {
    const album = this.rows.get(id)
    if (!album) return null
    return { ...album, stickers: this.stickersByAlbum.get(id) ?? [] }
  }

  async findOwnership(id: number): Promise<{ userId: number | null } | null> {
    const album = this.rows.get(id)
    return album ? { userId: album.userId } : null
  }

  async create(data: CreateAlbumData): Promise<Album> {
    return this.insert({ ...data, userId: data.userId ?? null })
  }

  async update(id: number, data: UpdateAlbumData): Promise<Album> {
    const album = this.require(id)
    const updated: Album = { ...album, ...data }
    this.rows.set(id, updated)
    return updated
  }

  async delete(id: number): Promise<Album> {
    const album = this.require(id)
    this.rows.delete(id)
    this.stickersByAlbum.delete(id)
    return album
  }

  private require(id: number): Album {
    const album = this.rows.get(id)
    if (!album) throw new Error(`Álbum ${id} inexistente en el fake`)
    return album
  }

  private insert(data: SeedAlbum, index = 0): Album {
    const id = data.id ?? this.nextId
    this.nextId = Math.max(this.nextId, id) + 1
    const album: Album = {
      id,
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      releaseDate: data.releaseDate ?? null,
      stickerType: data.stickerType ?? null,
      totalStickers: data.totalStickers,
      userId: data.userId ?? null,
      createdAt: data.createdAt ?? new Date(`2026-01-01T00:00:${String(index).padStart(2, '0')}Z`),
    }
    this.rows.set(id, album)
    if (data.stickers) this.stickersByAlbum.set(id, data.stickers)
    return album
  }
}
