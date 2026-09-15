export interface Album {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  releaseDate: string | null
  stickerType: string | null
  totalStickers: number
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
