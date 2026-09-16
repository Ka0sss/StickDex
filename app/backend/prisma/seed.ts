import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function ensureSampleImages(uploadDir: string) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  // Portada del álbum
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="50%" stop-color="#4338ca"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#bg)" rx="16"/>
    <circle cx="300" cy="180" r="110" fill="#ffffff" opacity="0.06"/>
    <circle cx="300" cy="180" r="80" fill="url(#gold)" opacity="0.2"/>
    <path d="M 300 110 L 320 160 L 375 160 L 330 195 L 345 250 L 300 215 L 255 250 L 270 195 L 225 160 L 280 160 Z" fill="url(#gold)"/>
    <text x="300" y="300" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">MUNDIAL 2026</text>
    <text x="300" y="335" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="4">ÁLBUM OFICIAL DE COLECCIÓN</text>
  </svg>`
  fs.writeFileSync(path.join(uploadDir, 'mundial-2026-cover.svg'), coverSvg)

  // Láminas muestra
  const stickerData = [
    { n: 1, title: 'Escudo FIFA', color: '#3b82f6', icon: '🛡️' },
    { n: 2, title: 'Lionel Messi', color: '#0ea5e9', icon: '👑' },
    { n: 3, title: 'Kylian Mbappé', color: '#6366f1', icon: '⚡' },
    { n: 4, title: 'Erling Haaland', color: '#06b6d4', icon: '🤖' },
    { n: 5, title: 'Jude Bellingham', color: '#8b5cf6', icon: '⭐' },
    { n: 6, title: 'Vinícius Jr', color: '#eab308', icon: '🔥' },
    { n: 7, title: 'Lamine Yamal', color: '#f97316', icon: '💎' },
    { n: 8, title: 'Dibu Martínez', color: '#10b981', icon: '🧤' },
    { n: 9, title: 'Thibaut Courtois', color: '#14b8a6', icon: '🧱' },
    { n: 10, title: 'Trofeo del Mundial', color: '#f59e0b', icon: '🏆' },
  ]

  for (const s of stickerData) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380" width="300" height="380">
      <defs>
        <linearGradient id="grad${s.n}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${s.color}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="300" height="380" fill="url(#grad${s.n})" rx="12"/>
      <rect x="10" y="10" width="280" height="360" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.3" rx="8"/>
      <circle cx="150" cy="160" r="70" fill="#ffffff" opacity="0.1"/>
      <text x="150" y="180" font-family="system-ui, sans-serif" font-size="72" text-anchor="middle">${s.icon}</text>
      <rect x="20" y="20" width="40" height="26" fill="#ffffff" rx="6"/>
      <text x="40" y="38" font-family="system-ui, sans-serif" font-size="14" font-weight="900" fill="#0f172a" text-anchor="middle">#${s.n}</text>
      <text x="150" y="290" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">${s.title}</text>
      <text x="150" y="325" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="1">STICKDEX 2026</text>
    </svg>`
    fs.writeFileSync(path.join(uploadDir, `sticker-${s.n}.svg`), svg)
  }
}

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
    user = await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    })
  }

  return user
}

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  const uploadDir = path.join(process.cwd(), 'uploads')
  ensureSampleImages(uploadDir)
  console.log('✓ Imágenes muestra vectoriales creadas en uploads/')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Usuarios de prueba
  const user1 = await getOrCreateUser('coleccionista1', 'cole1@stickdex.com', hashedPassword)
  const user2 = await getOrCreateUser('coleccionista2', 'cole2@stickdex.com', hashedPassword)

  console.log('✓ Usuarios disponibles (contraseña: password123):')
  console.log(`  - ${user1.email} (${user1.username})`)
  console.log(`  - ${user2.email} (${user2.username})`)

  // 2. Álbum de prueba
  const albumCoverUrl = '/uploads/mundial-2026-cover.svg'
  let album = await prisma.album.findFirst({
    where: { name: 'Mundial 2026' },
  })

  const stickersPayload = [
    { number: 1, name: 'Escudo FIFA', type: 'Brillante', imageUrl: '/uploads/sticker-1.svg' },
    { number: 2, name: 'Lionel Messi', type: 'Capitán', imageUrl: '/uploads/sticker-2.svg' },
    { number: 3, name: 'Kylian Mbappé', type: 'Delantero', imageUrl: '/uploads/sticker-3.svg' },
    { number: 4, name: 'Erling Haaland', type: 'Delantero', imageUrl: '/uploads/sticker-4.svg' },
    { number: 5, name: 'Jude Bellingham', type: 'Mediocampista', imageUrl: '/uploads/sticker-5.svg' },
    { number: 6, name: 'Vinícius Júnior', type: 'Extremo', imageUrl: '/uploads/sticker-6.svg' },
    { number: 7, name: 'Lamine Yamal', type: 'Joven Promesa', imageUrl: '/uploads/sticker-7.svg' },
    { number: 8, name: 'Emiliano Martínez', type: 'Portero', imageUrl: '/uploads/sticker-8.svg' },
    { number: 9, name: 'Thibaut Courtois', type: 'Portero', imageUrl: '/uploads/sticker-9.svg' },
    { number: 10, name: 'Trofeo del Mundial', type: 'Especial', imageUrl: '/uploads/sticker-10.svg' },
  ]

  if (!album) {
    album = await prisma.album.create({
      data: {
        name: 'Mundial 2026',
        description: 'Álbum oficial de la Copa Mundial FIFA 2026',
        totalStickers: 10,
        stickerType: 'Fútbol',
        imageUrl: albumCoverUrl,
        releaseDate: new Date('2026-06-01'),
        userId: user1.id,
        stickers: {
          create: stickersPayload,
        },
      },
    })
    console.log('✓ Álbum "Mundial 2026" con 10 láminas e imágenes creado')
  } else {
    // Actualizar portada y fotos de láminas existentes
    await prisma.album.update({
      where: { id: album.id },
      data: { imageUrl: albumCoverUrl },
    })

    for (const s of stickersPayload) {
      const existingSticker = await prisma.sticker.findFirst({
        where: { albumId: album.id, number: s.number },
      })
      if (existingSticker) {
        await prisma.sticker.update({
          where: { id: existingSticker.id },
          data: { imageUrl: s.imageUrl },
        })
      } else {
        await prisma.sticker.create({
          data: { ...s, albumId: album.id },
        })
      }
    }
    console.log('✓ Álbum y láminas actualizados con sus imágenes')
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

  console.log('🎉 Seed completado exitosamente con imágenes.')
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
