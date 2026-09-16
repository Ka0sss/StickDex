import { beforeEach, describe, expect, it } from 'vitest'
import { CollectionService, computeProgress } from '@/services/collection.service'
import { InMemoryAlbumRepository } from './fakes/albumRepository.fake'
import { InMemoryCollectionRepository } from './fakes/collectionRepository.fake'
import { InMemoryStickerRepository } from './fakes/stickerRepository.fake'
import { InMemoryUserRepository } from './fakes/userRepository.fake'
import { expectHttpError } from './helpers/http'

const OWNER = 1
const OTHER = 2

type CollectionFixture = {
  users: InMemoryUserRepository
  albums: InMemoryAlbumRepository
  stickers: InMemoryStickerRepository
  collections: InMemoryCollectionRepository
  service: CollectionService
}

function createFixture(): CollectionFixture {
  const users = new InMemoryUserRepository([
    { id: OWNER, username: 'enrique', email: 'enrique@example.com', password: 'hash' },
    { id: OTHER, username: 'ana', email: 'ana@example.com', password: 'hash' },
  ])
  const albums = new InMemoryAlbumRepository([
    { id: 1, name: 'Mundial 2026', totalStickers: 6, userId: OWNER },
    { id: 2, name: 'Pokémon', totalStickers: 2, userId: OWNER },
  ])
  const stickers = new InMemoryStickerRepository([
    { id: 101, albumId: 1, number: 1, name: 'Uno' },
    { id: 102, albumId: 1, number: 2, name: 'Dos' },
    { id: 103, albumId: 1, number: 3, name: 'Tres' },
    { id: 104, albumId: 1, number: 4, name: 'Cuatro' },
    { id: 105, albumId: 1, number: 5, name: 'Cinco' },
    { id: 106, albumId: 1, number: 6, name: 'Seis' },
    { id: 201, albumId: 2, number: 1, name: 'Pikachu' },
  ])
  const collections = new InMemoryCollectionRepository({ albums, stickers, users }, [
    {
      id: 1,
      name: 'Mi álbum',
      albumId: 1,
      userId: OWNER,
      isPublic: false,
      collected: [
        { stickerId: 101 },
        { stickerId: 102, quantity: 3 },
        { stickerId: 103, isDuplicated: true },
      ],
    },
    {
      id: 2,
      name: 'Compartida',
      albumId: 1,
      userId: OTHER,
      isPublic: true,
      collected: [{ stickerId: 104 }],
    },
  ])

  return {
    users,
    albums,
    stickers,
    collections,
    service: new CollectionService(collections, stickers, albums, users),
  }
}

let fixture: CollectionFixture
let service: CollectionService

beforeEach(() => {
  fixture = createFixture()
  service = fixture.service
})

describe('computeProgress', () => {
  it('calcula el porcentaje redondeado de láminas únicas sobre el total', () => {
    expect(computeProgress(3, 6)).toEqual({ collectedCount: 3, totalStickers: 6, percentage: 50 })
    expect(computeProgress(1, 3)).toEqual({ collectedCount: 1, totalStickers: 3, percentage: 33 })
    expect(computeProgress(2, 3)).toEqual({ collectedCount: 2, totalStickers: 3, percentage: 67 })
  })

  it('devuelve 0 cuando el álbum no declara láminas', () => {
    expect(computeProgress(0, 0)).toEqual({ collectedCount: 0, totalStickers: 0, percentage: 0 })
  })
})

describe('CollectionService.getById', () => {
  it('devuelve la colección privada a su dueño con el progreso calculado', async () => {
    const detail = await service.getById(1, OWNER)

    expect(detail.name).toBe('Mi álbum')
    expect(detail.progress).toEqual({ collectedCount: 3, totalStickers: 6, percentage: 50 })
    expect(detail.stickers.map((row) => row.sticker.number)).toEqual([1, 2, 3])
  })

  it('devuelve 403 al leer la colección privada de otro usuario, incluso sin sesión', async () => {
    await expectHttpError(service.getById(1, OTHER), 403, 'Esta colección es privada')
    await expectHttpError(service.getById(1, undefined), 403, 'Esta colección es privada')
  })

  it('permite leer una colección pública ajena', async () => {
    const detail = await service.getById(2, OWNER)

    expect(detail.name).toBe('Compartida')
    expect(detail.progress.percentage).toBe(17)
  })

  it('devuelve 404 si la colección no existe', async () => {
    await expectHttpError(service.getById(999, OWNER), 404, 'Colección no encontrada')
    await expectHttpError(service.update(999, { name: 'X' }, OWNER), 404, 'Colección no encontrada')
    await expectHttpError(service.delete(999, OWNER), 404, 'Colección no encontrada')
  })
})

describe('CollectionService (mutaciones solo del dueño)', () => {
  it('devuelve 403 al modificar, borrar o agregar láminas a la colección ajena', async () => {
    await expectHttpError(
      service.update(1, { name: 'Robada' }, OTHER),
      403,
      'No tienes permiso para modificar esta colección',
    )
    await expectHttpError(
      service.delete(1, OTHER),
      403,
      'No tienes permiso para eliminar esta colección',
    )
    await expectHttpError(
      service.addSticker(1, { stickerId: 104 }, OTHER),
      403,
      'No tienes permiso para agregar láminas a esta colección',
    )
    await expectHttpError(
      service.removeSticker(1, 101, OTHER),
      403,
      'No tienes permiso para eliminar láminas de esta colección',
    )
  })

  it('permite al dueño renombrar y cambiar la visibilidad', async () => {
    const updated = await service.update(1, { name: 'Renombrada', isPublic: true }, OWNER)

    expect(updated.name).toBe('Renombrada')
    expect(updated.isPublic).toBe(true)
    expect(await service.getById(1, OTHER)).toMatchObject({ name: 'Renombrada' })
  })
})

describe('CollectionService.addSticker', () => {
  it('devuelve 404 si la lámina no existe', async () => {
    await expectHttpError(
      service.addSticker(1, { stickerId: 999 }, OWNER),
      404,
      'Lámina no encontrada',
    )
  })

  it('devuelve 400 si la lámina pertenece a otro álbum', async () => {
    await expectHttpError(
      service.addSticker(1, { stickerId: 201 }, OWNER),
      400,
      'La lámina no pertenece al álbum de esta colección',
    )
  })

  it('incrementa la cantidad existente y marca la repetida', async () => {
    const updated = await service.addSticker(1, { stickerId: 101 }, OWNER)

    expect(updated.quantity).toBe(2)
    expect(updated.isDuplicated).toBe(true)
  })

  it('usa cantidad 1 y no marcada cuando la lámina es nueva', async () => {
    const created = await service.addSticker(1, { stickerId: 104 }, OWNER)

    expect(created.quantity).toBe(1)
    expect(created.isDuplicated).toBe(false)
    expect(created.sticker.id).toBe(104)
  })

  it('respeta la cantidad y el flag explícitos del cliente', async () => {
    const duplicated = await service.addSticker(1, { stickerId: 105, quantity: 5 }, OWNER)
    expect(duplicated).toMatchObject({ quantity: 5, isDuplicated: true })

    const flagged = await service.addSticker(
      1,
      { stickerId: 106, quantity: 1, isDuplicated: true },
      OWNER,
    )
    expect(flagged).toMatchObject({ quantity: 1, isDuplicated: true })
  })
})

describe('CollectionService.updateSticker / removeSticker', () => {
  it('recalcula isDuplicated cuando no se envía', async () => {
    const updated = await service.updateSticker(1, 103, { quantity: 1 }, OWNER)

    expect(updated).toMatchObject({ quantity: 1, isDuplicated: false })
  })

  it('devuelve 404 si la lámina no está en la colección', async () => {
    await expectHttpError(
      service.updateSticker(1, 104, { quantity: 2 }, OWNER),
      404,
      'Lámina no encontrada en esta colección',
    )
    await expectHttpError(
      service.removeSticker(1, 104, OWNER),
      404,
      'Lámina no encontrada en esta colección',
    )
  })

  it('elimina la lámina de la colección del dueño', async () => {
    await service.removeSticker(1, 101, OWNER)

    expect(await fixture.collections.findCollectedSticker(1, 101)).toBeNull()
    expect((await service.missingStickers(1, OWNER)).map((s) => s.id)).toEqual([101, 104, 105, 106])
  })
})

describe('CollectionService.missingStickers / duplicatedStickers', () => {
  it('lista las láminas del álbum que no se poseen', async () => {
    const missing = await service.missingStickers(1, OWNER)

    expect(missing.map((sticker) => sticker.number)).toEqual([4, 5, 6])
  })

  it('lista repetidas por cantidad o por flag, con su cantidad', async () => {
    const duplicated = await service.duplicatedStickers(1, OWNER)

    expect(duplicated).toEqual([
      { stickerId: 102, number: 2, name: 'Dos', imageUrl: null, quantity: 3 },
      { stickerId: 103, number: 3, name: 'Tres', imageUrl: null, quantity: 1 },
    ])
  })

  it('devuelve 403 en colecciones privadas ajenas', async () => {
    await expectHttpError(service.missingStickers(1, OTHER), 403, 'Esta colección es privada')
    await expectHttpError(service.duplicatedStickers(1, OTHER), 403, 'Esta colección es privada')
    await expectHttpError(service.missingStickers(1, undefined), 403, 'Esta colección es privada')
  })
})

describe('CollectionService.list', () => {
  it('solo expone las públicas a los demás usuarios', async () => {
    const shared = await service.list({ currentUserId: OTHER })
    expect(shared.map((row) => row.name)).toEqual(['Compartida'])

    const anonymous = await service.list({})
    expect(anonymous.map((row) => row.name)).toEqual(['Compartida'])
  })

  it('incluye las privadas propias cuando el filtro es el del propio usuario', async () => {
    const own = await service.list({ userId: OWNER, currentUserId: OWNER })

    expect(own.map((row) => row.name)).toEqual(['Mi álbum'])
    expect(own[0].progress).toEqual({ collectedCount: 3, totalStickers: 6, percentage: 50 })
  })

  it('no filtra por privadas ajenas al pedir las colecciones de otro usuario', async () => {
    const foreign = await service.list({ userId: OWNER, currentUserId: OTHER })

    expect(foreign).toEqual([])
  })

  it('devuelve lista vacía si piden explícitamente las privadas de otro', async () => {
    expect(await service.list({ userId: OWNER, isPublic: false, currentUserId: OTHER })).toEqual([])
    expect(await service.list({ userId: OWNER, isPublic: false })).toEqual([])
  })

  it('permite al dueño pedir sus propias colecciones privadas', async () => {
    const own = await service.list({ userId: OWNER, isPublic: false, currentUserId: OWNER })

    expect(own.map((row) => row.name)).toEqual(['Mi álbum'])
  })
})
