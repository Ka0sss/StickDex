import { collectionRepository } from '../repositories/collection.repository'
import { stickerRepository } from '../repositories/sticker.repository'
import { userRepository } from '../repositories/user.repository'
import { albumService } from './album.service'
import { HttpError } from '../utils/httpError'

type CreateCollectionData = {
  name: string
  albumId: number
  userId: number
  isPublic?: boolean
}

type UpdateCollectionData = {
  name?: string
  isPublic?: boolean
}

type AddStickerData = {
  stickerId: number
  quantity?: number
  isDuplicated?: boolean
}

type UpdateStickerData = {
  quantity?: number
  isDuplicated?: boolean
}

export const collectionService = {
  list(filter?: { userId?: number; isPublic?: boolean }) {
    return collectionRepository.findAll(filter)
  },

  async getById(id: number) {
    const collection = await collectionRepository.findDetailedById(id)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    const totalStickers = collection.album.totalStickers
    const collectedCount = collection.stickers.length
    const percentage = totalStickers > 0 ? Math.round((collectedCount / totalStickers) * 100) : 0

    return {
      ...collection,
      progress: {
        collectedCount,
        totalStickers,
        percentage,
      },
    }
  },

  async create(data: CreateCollectionData) {
    await albumService.getById(data.albumId)

    const user = await userRepository.findById(data.userId)
    if (!user) throw new HttpError(404, 'Usuario no encontrado')

    return collectionRepository.create(data)
  },

  async update(id: number, data: UpdateCollectionData) {
    await this.getById(id)
    return collectionRepository.update(id, data)
  },

  async delete(id: number) {
    await this.getById(id)
    return collectionRepository.delete(id)
  },

  async addSticker(collectionId: number, data: AddStickerData) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    const sticker = await stickerRepository.findById(data.stickerId)
    if (!sticker) throw new HttpError(404, 'Lámina no encontrada')

    if (sticker.albumId !== collection.albumId) {
      throw new HttpError(400, 'La lámina no pertenece al álbum de esta colección')
    }

    const existing = await collectionRepository.findCollectedSticker(collectionId, data.stickerId)
    const quantity = data.quantity ?? (existing ? existing.quantity + 1 : 1)
    const isDuplicated = data.isDuplicated !== undefined ? data.isDuplicated : quantity > 1

    return collectionRepository.upsertCollectedSticker(collectionId, data.stickerId, {
      quantity,
      isDuplicated,
    })
  },

  async updateSticker(collectionId: number, stickerId: number, data: UpdateStickerData) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    const existing = await collectionRepository.findCollectedSticker(collectionId, stickerId)
    if (!existing) throw new HttpError(404, 'Lámina no encontrada en esta colección')

    const quantity = data.quantity !== undefined ? data.quantity : existing.quantity
    const isDuplicated = data.isDuplicated !== undefined ? data.isDuplicated : quantity > 1

    return collectionRepository.updateCollectedSticker(collectionId, stickerId, {
      quantity,
      isDuplicated,
    })
  },

  async removeSticker(collectionId: number, stickerId: number) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    const existing = await collectionRepository.findCollectedSticker(collectionId, stickerId)
    if (!existing) throw new HttpError(404, 'Lámina no encontrada en esta colección')

    return collectionRepository.removeCollectedSticker(collectionId, stickerId)
  },

  async missingStickers(collectionId: number) {
    const missing = await collectionRepository.findMissingStickers(collectionId)
    if (missing === null) throw new HttpError(404, 'Colección no encontrada')
    return missing
  },

  async duplicatedStickers(collectionId: number) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    const duplicates = await collectionRepository.findDuplicatedStickers(collectionId)
    return duplicates.map(({ sticker, quantity }) => ({
      stickerId: sticker.id,
      number: sticker.number,
      name: sticker.name,
      imageUrl: sticker.imageUrl,
      quantity,
    }))
  },
}
