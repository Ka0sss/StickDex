import { PrismaAlbumRepository } from '@/repositories/album.repository'
import { PrismaCollectionRepository } from '@/repositories/collection.repository'
import { PrismaSessionRepository } from '@/repositories/session.repository'
import { PrismaStickerRepository } from '@/repositories/sticker.repository'
import { PrismaUserRepository } from '@/repositories/user.repository'
import { AlbumService } from '@/services/album.service'
import { AuthService } from '@/services/auth.service'
import { CollectionService } from '@/services/collection.service'
import { StickerService } from '@/services/sticker.service'
import { AlbumController } from '@/controllers/album.controller'
import { AuthController } from '@/controllers/auth.controller'
import { CollectionController } from '@/controllers/collection.controller'
import { HealthController } from '@/controllers/health.controller'
import { StickerController } from '@/controllers/sticker.controller'
import { UploadController } from '@/controllers/upload.controller'
import { PrismaHealthRepository } from '@/repositories/health.repository'
import { PrismaSessionStore } from '@/config/sessionStore'

// Raíz de composición: único lugar donde se eligen las implementaciones
// concretas y se inyectan por constructor (Dependency Inversion).
const users = new PrismaUserRepository()
const albums = new PrismaAlbumRepository()
const stickers = new PrismaStickerRepository()
const collections = new PrismaCollectionRepository()

export const sessionStore = new PrismaSessionStore(new PrismaSessionRepository())

export const authController = new AuthController(new AuthService(users))
export const albumController = new AlbumController(new AlbumService(albums))
export const stickerController = new StickerController(new StickerService(stickers, albums))
export const collectionController = new CollectionController(
  new CollectionService(collections, stickers, albums, users),
)
export const uploadController = new UploadController()
export const healthController = new HealthController(new PrismaHealthRepository())
