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
  list(filter?: { userId?: number; isPublic?: boolean }, currentUserId?: number) {
    if (filter?.userId !== undefined) {
      // Si consulta sus propias colecciones, puede ver públicas y privadas. Si no, solo públicas.
      const isOwner = currentUserId !== undefined && currentUserId === filter.userId
      return collectionRepository.findAll({
        userId: filter.userId,
        ...(isOwner ? (filter.isPublic !== undefined ? { isPublic: filter.isPublic } : {}) : { isPublic: true }),
      })
    }

    if (currentUserId !== undefined) {
      // Colecciones públicas o las propias
      return collectionRepository.findAll({
        OR: [{ isPublic: true }, { userId: currentUserId }],
      })
    }

    // Usuario anónimo solo ve públicas
    return collectionRepository.findAll({ isPublic: true })
  },

  async getById(id: number, currentUserId?: number) {
    const collection = await collectionRepository.findDetailedById(id)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (!collection.isPublic && (!currentUserId || collection.userId !== currentUserId)) {
      throw new HttpError(403, 'Esta colección es privada')
    }

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

  async update(id: number, data: UpdateCollectionData, currentUserId: number) {
    const collection = await collectionRepository.findById(id)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (collection.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para modificar esta colección')
    }

    return collectionRepository.update(id, data)
  },

  async delete(id: number, currentUserId: number) {
    const collection = await collectionRepository.findById(id)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (collection.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para eliminar esta colección')
    }

    return collectionRepository.delete(id)
  },

  async addSticker(collectionId: number, data: AddStickerData, currentUserId: number) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (collection.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para agregar láminas a esta colección')
    }

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

  async updateSticker(
    collectionId: number,
    stickerId: number,
    data: UpdateStickerData,
    currentUserId: number,
  ) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (collection.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para modificar láminas de esta colección')
    }

    const existing = await collectionRepository.findCollectedSticker(collectionId, stickerId)
    if (!existing) throw new HttpError(404, 'Lámina no encontrada en esta colección')

    const quantity = data.quantity !== undefined ? data.quantity : existing.quantity
    const isDuplicated = data.isDuplicated !== undefined ? data.isDuplicated : quantity > 1

    return collectionRepository.updateCollectedSticker(collectionId, stickerId, {
      quantity,
      isDuplicated,
    })
  },

  async removeSticker(collectionId: number, stickerId: number, currentUserId: number) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (collection.userId !== currentUserId) {
      throw new HttpError(403, 'No tienes permiso para eliminar láminas de esta colección')
    }

    const existing = await collectionRepository.findCollectedSticker(collectionId, stickerId)
    if (!existing) throw new HttpError(404, 'Lámina no encontrada en esta colección')

    return collectionRepository.removeCollectedSticker(collectionId, stickerId)
  },

  async missingStickers(collectionId: number, currentUserId?: number) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (!collection.isPublic && (!currentUserId || collection.userId !== currentUserId)) {
      throw new HttpError(403, 'Esta colección es privada')
    }

    const missing = await collectionRepository.findMissingStickers(collectionId)
    if (missing === null) throw new HttpError(404, 'Colección no encontrada')
    return missing
  },

  async duplicatedStickers(collectionId: number, currentUserId?: number) {
    const collection = await collectionRepository.findById(collectionId)
    if (!collection) throw new HttpError(404, 'Colección no encontrada')

    if (!collection.isPublic && (!currentUserId || collection.userId !== currentUserId)) {
      throw new HttpError(403, 'Esta colección es privada')
    }

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
