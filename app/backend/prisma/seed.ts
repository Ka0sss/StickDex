import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function getOrCreateUser(username: string, email: string, passwordHash: string) {
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
      },
    })
  } else {
    // Asegurar que la contraseña sea la conocida
    user = await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    })
  }

  return user
}

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Usuarios de prueba
  const user1 = await getOrCreateUser('coleccionista1', 'cole1@stickdex.com', hashedPassword)
  const user2 = await getOrCreateUser('coleccionista2', 'cole2@stickdex.com', hashedPassword)

  console.log('✓ Usuarios disponibles (contraseña: password123):')
  console.log(`  - ${user1.email} (${user1.username})`)
  console.log(`  - ${user2.email} (${user2.username})`)

  // 2. Álbum de prueba
  let album = await prisma.album.findFirst({
    where: { name: 'Mundial 2026' },
  })

  if (!album) {
    album = await prisma.album.create({
      data: {
        name: 'Mundial 2026',
        description: 'Álbum oficial de la Copa Mundial FIFA 2026',
        totalStickers: 10,
        stickerType: 'Fútbol',
        releaseDate: new Date('2026-06-01'),
        userId: user1.id,
        stickers: {
          create: [
            { number: 1, name: 'Escudo FIFA', type: 'Brillante' },
            { number: 2, name: 'Lionel Messi', type: 'Capitán' },
            { number: 3, name: 'Kylian Mbappé', type: 'Delantero' },
            { number: 4, name: 'Erling Haaland', type: 'Delantero' },
            { number: 5, name: 'Jude Bellingham', type: 'Mediocampista' },
            { number: 6, name: 'Vinícius Júnior', type: 'Extremo' },
            { number: 7, name: 'Lamine Yamal', type: 'Joven Promesa' },
            { number: 8, name: 'Emiliano Martínez', type: 'Portero' },
            { number: 9, name: 'Thibaut Courtois', type: 'Portero' },
            { number: 10, name: 'Trofeo del Mundial', type: 'Especial' },
          ],
        },
      },
    })
    console.log('✓ Álbum "Mundial 2026" con 10 láminas creado')
  } else {
    console.log('ℹ Álbum "Mundial 2026" ya existe')
  }

  // 3. Colección de prueba para coleccionista1
  const existingCol = await prisma.collection.findFirst({
    where: { userId: user1.id, albumId: album.id },
  })

  if (!existingCol) {
    const stickers = await prisma.sticker.findMany({
      where: { albumId: album.id },
      orderBy: { number: 'asc' },
    })

    if (stickers.length >= 5) {
      await prisma.collection.create({
        data: {
          name: 'Mi Álbum del Mundial',
          albumId: album.id,
          userId: user1.id,
          isPublic: true,
          stickers: {
            create: [
              { stickerId: stickers[0].id, quantity: 1, isDuplicated: false },
              { stickerId: stickers[1].id, quantity: 2, isDuplicated: true }, // Repetida!
              { stickerId: stickers[2].id, quantity: 1, isDuplicated: false },
              { stickerId: stickers[3].id, quantity: 3, isDuplicated: true }, // Repetida!
              { stickerId: stickers[4].id, quantity: 1, isDuplicated: false },
            ],
          },
        },
      })
      console.log('✓ Colección de prueba creada (5 láminas pegadas, 2 repetidas, 5 faltantes)')
    }
  } else {
    console.log('ℹ Colección de prueba ya existe')
  }

  console.log('🎉 Seed completado exitosamente.')
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
