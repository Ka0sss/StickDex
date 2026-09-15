import { collectionRepository } from '../repositories/collection.repository'
import { HttpError } from '../utils/httpError'

export const collectionService = {
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
