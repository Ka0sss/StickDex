import { describe, expect, it } from 'vitest'
import { albumParamsSchema, createAlbumSchema, updateAlbumSchema } from '@/validations/album.schema'
import {
  albumIdParamsSchema,
  createStickersBulkSchema,
  createStickerSchema,
  stickerIdParamsSchema,
  updateStickerSchema,
} from '@/validations/sticker.schema'
import { createCollectionSchema, listCollectionsQuerySchema } from '@/validations/collection.schema'
import '@/validations/errorMap'
import { failureOf, messagesAt } from './helpers/zod'

const VALID_STICKER = { number: 1, name: 'Messi' }

describe('createAlbumSchema', () => {
  const valid = { name: 'Mundial 2026', totalStickers: 500 }

  it('rechaza un nombre de solo espacios', () => {
    const error = failureOf(createAlbumSchema.safeParse({ ...valid, name: '   ' }))

    expect(messagesAt(error, 'name')).toContain('Este campo es obligatorio')
  })

  it('rechaza totalStickers enviado como texto', () => {
    const error = failureOf(createAlbumSchema.safeParse({ ...valid, totalStickers: '500' }))

    expect(messagesAt(error, 'totalStickers')).toEqual(['Se esperaba número y se recibió texto'])
  })

  it('rechaza totalStickers cero o negativo', () => {
    const error = failureOf(createAlbumSchema.safeParse({ ...valid, totalStickers: 0 }))

    expect(error.issues.map((issue) => issue.path.join('.'))).toContain('totalStickers')
  })

  it('acepta releaseDate null para limpiar la fecha', () => {
    const result = createAlbumSchema.safeParse({ ...valid, releaseDate: null })

    expect(result.success).toBe(true)
    expect(result.success && result.data.releaseDate).toBeNull()
  })

  it('rechaza releaseDate con texto basura', () => {
    const error = failureOf(createAlbumSchema.safeParse({ ...valid, releaseDate: 'garbage' }))

    expect(messagesAt(error, 'releaseDate')).toContain(
      'El valor no coincide con ninguno de los formatos permitidos',
    )
  })

  it('acepta una fecha ISO y la convierte en Date', () => {
    const result = createAlbumSchema.safeParse({ ...valid, releaseDate: '2026-06-01' })

    expect(result.success && result.data.releaseDate).toEqual(new Date('2026-06-01'))
  })
})

describe('imageUrlField (álbumes y láminas)', () => {
  const valid = { name: 'Mundial 2026', totalStickers: 500 }

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'ftp://x/y.png'])(
    'rechaza la URL peligrosa %s',
    (imageUrl) => {
      const error = failureOf(createAlbumSchema.safeParse({ ...valid, imageUrl }))

      expect(messagesAt(error, 'imageUrl')).toEqual([
        'Debe ser una ruta /uploads/... o una URL http(s)',
      ])
    },
  )

  it.each(['/uploads/x.png', 'https://cdn.example.com/x.png'])('acepta la URL %s', (imageUrl) => {
    const result = createAlbumSchema.safeParse({ ...valid, imageUrl })

    expect(result.success).toBe(true)
    expect(result.success && result.data.imageUrl).toBe(imageUrl)
  })
})

describe('createStickersBulkSchema', () => {
  const sticker = { number: 1, name: 'Messi' }

  it('acepta 500 láminas y rechaza 501 con el mensaje de límite', () => {
    const bulkOf = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ ...sticker, number: index + 1 }))

    const accepted = createStickersBulkSchema.safeParse({ stickers: bulkOf(500) })
    expect(accepted.success).toBe(true)
    expect(accepted.success && accepted.data.stickers.length).toBe(500)

    const error = failureOf(createStickersBulkSchema.safeParse({ stickers: bulkOf(501) }))
    expect(messagesAt(error, 'stickers')).toContain('No puede contener más de 500 elementos')
  })

  it('rechaza una lista vacía', () => {
    const error = failureOf(createStickersBulkSchema.safeParse({ stickers: [] }))

    expect(messagesAt(error, 'stickers')).toContain('Debe contener al menos 1 elementos')
  })
})

describe('esquemas de actualización', () => {
  it('rechaza un update vacío en álbum, lámina y colección', () => {
    const albumError = failureOf(updateAlbumSchema.safeParse({}))
    expect(messagesAt(albumError, '')).toEqual(['Debe enviar al menos un campo para actualizar'])

    const stickerError = failureOf(updateStickerSchema.safeParse({}))
    expect(messagesAt(stickerError, '')).toEqual(['Debe enviar al menos un campo para actualizar'])
  })

  it('acepta un update con un solo campo', () => {
    const result = updateStickerSchema.safeParse({ name: 'Messi' })

    expect(result.success).toBe(true)
    expect(result.success && result.data).toEqual({ name: 'Messi' })
  })
})

describe('ids de ruta', () => {
  // `albumParamsSchema` valida `/:id` de /albums/:id; `albumIdParamsSchema` valida `/:albumId`.
  it.each(['0x10', '1e3', 'abc', '1.5', '', '-3'])('rechaza el id %s', (id) => {
    const albumError = failureOf(albumParamsSchema.safeParse({ id }))
    expect(messagesAt(albumError, 'id')).toContain('Debe ser un id numérico')

    const albumIdError = failureOf(albumIdParamsSchema.safeParse({ albumId: id }))
    expect(messagesAt(albumIdError, 'albumId')).toContain('Debe ser un id numérico')

    const stickerError = failureOf(stickerIdParamsSchema.safeParse({ id }))
    expect(messagesAt(stickerError, 'id')).toContain('Debe ser un id numérico')
  })

  it("transforma '10' en el número 10", () => {
    const result = albumIdParamsSchema.safeParse({ albumId: '10' })

    expect(result.success).toBe(true)
    expect(result.success && result.data.albumId).toBe(10)
  })

  it('rechaza un id por encima del máximo de MySQL', () => {
    const error = failureOf(stickerIdParamsSchema.safeParse({ id: '2147483648' }))

    expect(messagesAt(error, 'id')).toContain('El id debe estar entre 1 y 2147483647')
  })
})

describe('listCollectionsQuerySchema', () => {
  it("rechaza isPublic='maybe'", () => {
    const error = failureOf(listCollectionsQuerySchema.safeParse({ isPublic: 'maybe' }))

    expect(error.issues.map((issue) => issue.path.join('.'))).toContain('isPublic')
  })

  it.each([
    ['true', true],
    ['false', false],
  ])('traduce isPublic=%s a %s', (input, expected) => {
    const result = listCollectionsQuerySchema.safeParse({ isPublic: input })

    expect(result.success).toBe(true)
    expect(result.success && result.data.isPublic).toBe(expected)
  })

  it("rechaza userId='abc' y acepta '7'", () => {
    const error = failureOf(listCollectionsQuerySchema.safeParse({ userId: 'abc' }))
    expect(error.issues.map((issue) => issue.path.join('.'))).toContain('userId')

    const result = listCollectionsQuerySchema.safeParse({ userId: '7' })
    expect(result.success && result.data.userId).toBe(7)
  })
})

describe('createCollectionSchema', () => {
  it('aplica isPublic=false por defecto y valida el álbum', () => {
    const result = createCollectionSchema.safeParse({ name: 'Mi colección', albumId: 3 })

    expect(result.success && result.data).toEqual({
      name: 'Mi colección',
      albumId: 3,
      isPublic: false,
    })
  })

  it('rechaza un álbum inexistente enviado como texto', () => {
    const error = failureOf(
      createCollectionSchema.safeParse({ name: 'Mi colección', albumId: 'x' }),
    )

    expect(error.issues.map((issue) => issue.path.join('.'))).toContain('albumId')
  })
})

describe('createStickerSchema', () => {
  it('rechaza una lámina sin nombre', () => {
    const error = failureOf(createStickerSchema.safeParse({ ...VALID_STICKER, name: '' }))

    expect(messagesAt(error, 'name')).toContain('Este campo es obligatorio')
  })
})
