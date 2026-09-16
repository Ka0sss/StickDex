export interface User {
  id: number
  username: string
  email: string
}

/** Resumen del álbum incluido en los listados de colecciones. */
export interface AlbumSummary {
  id: number
  name: string
  totalStickers: number
  imageUrl: string | null
}

export interface Album {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  releaseDate: string | null
  stickerType: string | null
  totalStickers: number
  userId: number | null
  createdAt: string
  stickers?: Sticker[]
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

export interface PublicUserSummary {
  id: number
  username: string
}

/** Item de `GET /collections`: incluye progreso calculado por el servidor. */
export interface CollectionSummary {
  id: number
  name: string
  isPublic: boolean
  userId: number
  albumId: number
  createdAt: string
  album: AlbumSummary
  user: PublicUserSummary
  progress: CollectionProgress
}

/** Respuesta de `GET /collections/:id`. */
export interface CollectionDetail {
  id: number
  name: string
  isPublic: boolean
  userId: number
  albumId: number
  createdAt: string
  album: Album
  user: PublicUserSummary
  stickers: CollectedStickerItem[]
  progress: CollectionProgress
}
