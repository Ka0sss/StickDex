export interface User {
  id: number
  username: string
  email: string
}

export interface Album {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  releaseDate: string | null
  stickerType: string | null
  totalStickers: number
  userId?: number | null
  createdAt: string
}

export interface Sticker {
  id: number
  number: number
  name: string
  imageUrl: string | null
  type: string | null
  albumId: number
  createdAt: string
}

export interface DuplicatedSticker {
  stickerId: number
  number: number
  name: string
  imageUrl: string | null
  quantity: number
}

export interface CollectionProgress {
  collectedCount: number
  totalStickers: number
  percentage: number
}

export interface CollectedStickerItem {
  id: number
  collectionId: number
  stickerId: number
  quantity: number
  isDuplicated: boolean
  sticker: Sticker
}

export interface Collection {
  id: number
  name: string
  isPublic: boolean
  userId: number
  albumId: number
  createdAt: string
  album?: Album
  user?: { id: number; username: string }
  stickers?: CollectedStickerItem[]
  progress?: CollectionProgress
  _count?: { stickers: number }
}
