import type { Sticker } from '@prisma/client'
import type {
  CreateManyResult,
  CreateStickerData,
  IStickerRepository,
  UpdateStickerData,
} from '@/interfaces/sticker.repository.interface'

export type SeedSticker = {
  id?: number
  albumId: number
  number: number
  name: string
  imageUrl?: string | null
  type?: string | null
  createdAt?: Date
}

/** Repositorio de láminas en memoria; `findByAlbum` ordena por número como el real. */
export class InMemoryStickerRepository implements IStickerRepository {
  private readonly rows = new Map<number, Sticker>()
  private nextId = 1

  constructor(seed: SeedSticker[] = []) {
    for (const [index, sticker] of seed.entries()) this.insert(sticker, index)
  }

  async findByAlbum(albumId: number): Promise<Sticker[]> {
    return [...this.rows.values()]
      .filter((row) => row.albumId === albumId)
      .sort((a, b) => a.number - b.number)
  }

  async findById(id: number): Promise<Sticker | null> {
    return this.rows.get(id) ?? null
  }

  async create(albumId: number, data: CreateStickerData): Promise<Sticker> {
    return this.insert({ ...data, albumId })
  }

  async createMany(albumId: number, stickers: CreateStickerData[]): Promise<CreateManyResult> {
    for (const sticker of stickers) this.insert({ ...sticker, albumId })
    return { count: stickers.length }
  }

  async update(id: number, data: UpdateStickerData): Promise<Sticker> {
    const sticker = this.rows.get(id)
    if (!sticker) throw new Error(`Lámina ${id} inexistente en el fake`)
    const updated: Sticker = { ...sticker, ...data }
    this.rows.set(id, updated)
    return updated
  }

  async delete(id: number): Promise<Sticker> {
    const sticker = this.rows.get(id)
    if (!sticker) throw new Error(`Lámina ${id} inexistente en el fake`)
    this.rows.delete(id)
    return sticker
  }

  private insert(data: SeedSticker, index = 0): Sticker {
    const id = data.id ?? this.nextId
    this.nextId = Math.max(this.nextId, id) + 1
    const sticker: Sticker = {
      id,
      number: data.number,
      name: data.name,
      imageUrl: data.imageUrl ?? null,
      type: data.type ?? null,
      albumId: data.albumId,
      createdAt: data.createdAt ?? new Date(`2026-01-01T00:00:${String(index).padStart(2, '0')}Z`),
    }
    this.rows.set(id, sticker)
    return sticker
  }
}
