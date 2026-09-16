import type { Sticker } from '@prisma/client'
import type { CreateManyResult } from '@/interfaces/sticker.repository.interface'
import type { CreateStickerInput, UpdateStickerInput } from '@/validations/sticker.schema'

export interface IStickerService {
  /** Lanza 404 si el álbum no existe. */
  listByAlbum(albumId: number): Promise<Sticker[]>
  /** Lanza 403 si el álbum pertenece a otro usuario. */
  create(albumId: number, data: CreateStickerInput, userId: number): Promise<Sticker>
  /** Lanza 403 si el álbum pertenece a otro usuario. */
  createBulk(
    albumId: number,
    stickers: CreateStickerInput[],
    userId: number,
  ): Promise<CreateManyResult>
  /** Lanza 403 si el álbum de la lámina pertenece a otro usuario. */
  update(id: number, data: UpdateStickerInput, userId: number): Promise<Sticker>
  /** Lanza 403 si el álbum de la lámina pertenece a otro usuario. */
  delete(id: number, userId: number): Promise<void>
}
