import { beforeEach, describe, expect, it } from 'vitest'
import type { Sticker } from '@prisma/client'
import { AlbumService } from '@/services/album.service'
import { StickerService } from '@/services/sticker.service'
import { InMemoryAlbumRepository } from './fakes/albumRepository.fake'
import { InMemoryStickerRepository } from './fakes/stickerRepository.fake'
import { expectHttpError } from './helpers/http'

const OWNER = 1
const OTHER = 2

const OWNED_STICKER: Sticker = {
  id: 11,
  albumId: 1,
  number: 1,
  name: 'Uno',
  imageUrl: null,
  type: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

type CatalogFixture = {
  albums: InMemoryAlbumRepository
  stickers: InMemoryStickerRepository
  albumService: AlbumService
  stickerService: StickerService
}

function createFixture(): CatalogFixture {
  const albums = new InMemoryAlbumRepository([
    { id: 1, name: 'Mío', totalStickers: 2, userId: OWNER, stickers: [OWNED_STICKER] },
    { id: 2, name: 'Ajeno', totalStickers: 2, userId: OTHER },
    { id: 3, name: 'Sin dueño', totalStickers: 1, userId: null },
  ])
  const stickers = new InMemoryStickerRepository([
    OWNED_STICKER,
    { id: 21, albumId: 2, number: 2, name: 'Dos' },
    { id: 22, albumId: 2, number: 1, name: 'Uno del ajeno' },
    { id: 31, albumId: 3, number: 1, name: 'Huérfana' },
  ])

  return {
    albums,
    stickers,
    albumService: new AlbumService(albums),
    stickerService: new StickerService(stickers, albums),
  }
}

let fixture: CatalogFixture
let albumService: AlbumService
let stickerService: StickerService

beforeEach(() => {
  fixture = createFixture()
  albumService = fixture.albumService
  stickerService = fixture.stickerService
})

describe('AlbumService.getById', () => {
  it('devuelve el álbum con sus láminas', async () => {
    const album = await albumService.getById(1)

    expect(album.name).toBe('Mío')
    expect(album.stickers.map((sticker) => sticker.id)).toEqual([11])
  })

  it('devuelve 404 si el álbum no existe', async () => {
    await expectHttpError(albumService.getById(999), 404, 'Álbum no encontrado')
  })
})

describe('AlbumService.create', () => {
  it('crea el álbum a nombre del usuario indicado', async () => {
    const album = await albumService.create({ name: 'Nuevo', totalStickers: 10 }, OWNER)

    expect(album).toMatchObject({ name: 'Nuevo', totalStickers: 10, userId: OWNER })
    expect((await albumService.list()).map((row) => row.name)).toContain('Nuevo')
  })
})

describe('AlbumService.update / delete (solo el dueño)', () => {
  it('devuelve 403 al modificar o borrar el álbum de otro usuario', async () => {
    await expectHttpError(
      albumService.update(2, { name: 'Hackeado' }, OWNER),
      403,
      'No tienes permiso para modificar este álbum',
    )
    await expectHttpError(
      albumService.delete(2, OWNER),
      403,
      'No tienes permiso para eliminar este álbum',
    )
  })

  it('devuelve 403 para un álbum sin dueño, incluso sin sesión identificada', async () => {
    await expectHttpError(
      albumService.update(3, { name: 'Hackeado' }, OWNER),
      403,
      'No tienes permiso para modificar este álbum',
    )
    await expectHttpError(
      albumService.delete(3, OWNER),
      403,
      'No tienes permiso para eliminar este álbum',
    )
  })

  it('devuelve 404 en álbumes inexistentes', async () => {
    await expectHttpError(
      albumService.update(999, { name: 'X' }, OWNER),
      404,
      'Álbum no encontrado',
    )
    await expectHttpError(albumService.delete(999, OWNER), 404, 'Álbum no encontrado')
  })

  it('deja al dueño actualizar y borrar su álbum', async () => {
    const updated = await albumService.update(1, { name: 'Renombrado', totalStickers: 30 }, OWNER)
    expect(updated).toMatchObject({ name: 'Renombrado', totalStickers: 30 })

    await albumService.delete(1, OWNER)
    await expectHttpError(albumService.getById(1), 404, 'Álbum no encontrado')
  })
})

describe('StickerService.listByAlbum', () => {
  it('devuelve las láminas ordenadas por número', async () => {
    const stickers = await stickerService.listByAlbum(2)

    expect(stickers.map((sticker) => sticker.number)).toEqual([1, 2])
  })

  it('devuelve 404 si el álbum no existe', async () => {
    await expectHttpError(stickerService.listByAlbum(999), 404, 'Álbum no encontrado')
  })
})

describe('StickerService.create / createBulk (solo el dueño del álbum)', () => {
  it('devuelve 403 al agregar láminas al álbum de otro', async () => {
    await expectHttpError(
      stickerService.create(2, { number: 3, name: 'Intrusa' }, OWNER),
      403,
      'No tienes permiso para agregar láminas a este álbum',
    )
    await expectHttpError(
      stickerService.createBulk(2, [{ number: 3, name: 'Intrusa' }], OWNER),
      403,
      'No tienes permiso para agregar láminas a este álbum',
    )
  })

  it('devuelve 403 al agregar láminas a un álbum sin dueño', async () => {
    await expectHttpError(
      stickerService.create(3, { number: 3, name: 'Intrusa' }, OWNER),
      403,
      'No tienes permiso para agregar láminas a este álbum',
    )
  })

  it('devuelve 404 si el álbum no existe', async () => {
    await expectHttpError(
      stickerService.create(999, { number: 1, name: 'Fantasma' }, OWNER),
      404,
      'Álbum no encontrado',
    )
  })

  it('agrega una lámina y un lote al álbum propio', async () => {
    const created = await stickerService.create(1, { number: 7, name: 'Nueva' }, OWNER)
    expect(created).toMatchObject({ albumId: 1, number: 7, name: 'Nueva' })

    const bulk = await stickerService.createBulk(
      1,
      [
        { number: 8, name: 'Lote A' },
        { number: 9, name: 'Lote B' },
      ],
      OWNER,
    )
    expect(bulk.count).toBe(2)
    expect((await stickerService.listByAlbum(1)).map((sticker) => sticker.number)).toEqual([
      1, 7, 8, 9,
    ])
  })
})

describe('StickerService.update / delete (solo el dueño del álbum de la lámina)', () => {
  it('devuelve 403 cuando la lámina pertenece al álbum de otro', async () => {
    await expectHttpError(
      stickerService.update(21, { name: 'Hackeada' }, OWNER),
      403,
      'No tienes permiso para modificar láminas de este álbum',
    )
    await expectHttpError(
      stickerService.delete(21, OWNER),
      403,
      'No tienes permiso para eliminar láminas de este álbum',
    )
  })

  it('devuelve 403 cuando el álbum de la lámina no tiene dueño', async () => {
    await expectHttpError(
      stickerService.update(31, { name: 'Hackeada' }, OWNER),
      403,
      'No tienes permiso para modificar láminas de este álbum',
    )
  })

  it('devuelve 404 si la lámina no existe', async () => {
    await expectHttpError(
      stickerService.update(999, { name: 'X' }, OWNER),
      404,
      'Lámina no encontrada',
    )
    await expectHttpError(stickerService.delete(999, OWNER), 404, 'Lámina no encontrada')
  })

  it('actualiza y elimina la lámina propia', async () => {
    const updated = await stickerService.update(11, { name: 'Renombrada' }, OWNER)
    expect(updated.name).toBe('Renombrada')

    await stickerService.delete(11, OWNER)
    expect(await fixture.stickers.findById(11)).toBeNull()
  })
})
