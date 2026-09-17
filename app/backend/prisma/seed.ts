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

  // Portada de lujo del álbum (800x520)
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
    <defs>
      <linearGradient id="binderBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="35%" stop-color="#1e1b4b"/>
        <stop offset="70%" stop-color="#312e81"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="30%" stop-color="#f59e0b"/>
        <stop offset="70%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <radialGradient id="stadiumLight" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#1e1b4b" stop-opacity="0"/>
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    <rect width="800" height="520" fill="url(#binderBg)" rx="24"/>
    <rect x="16" y="16" width="768" height="488" fill="none" stroke="url(#goldFoil)" stroke-width="2" stroke-opacity="0.4" rx="16"/>
    <rect width="800" height="520" fill="url(#stadiumLight)"/>

    <!-- Rayos de estadio -->
    <g opacity="0.08" stroke="#ffffff" stroke-width="1.5">
      <line x1="400" y1="0" x2="100" y2="520"/>
      <line x1="400" y1="0" x2="250" y2="520"/>
      <line x1="400" y1="0" x2="400" y2="520"/>
      <line x1="400" y1="0" x2="550" y2="520"/>
      <line x1="400" y1="0" x2="700" y2="520"/>
    </g>

    <!-- Trofeo Central con Brillo -->
    <g filter="url(#glow)">
      <circle cx="400" cy="200" r="90" fill="url(#goldFoil)" opacity="0.15"/>
    </g>
    <circle cx="400" cy="200" r="75" fill="#0f172a" stroke="url(#goldFoil)" stroke-width="3"/>
    <text x="400" y="225" font-family="system-ui, sans-serif" font-size="80" text-anchor="middle">🏆</text>

    <!-- Tipografía Principal de Torneo -->
    <text x="400" y="340" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">COPA MUNDIAL 2026</text>
    <rect x="250" y="365" width="300" height="4" fill="url(#goldFoil)" rx="2"/>
    <text x="400" y="405" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#cbd5e1" text-anchor="middle" letter-spacing="6">ÁLBUM OFICIAL DE COLECCIÓN</text>

    <!-- Badge Edición Coleccionista -->
    <rect x="300" y="435" width="200" height="36" fill="url(#goldFoil)" rx="18"/>
    <text x="400" y="458" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="1">STICKDEX DELUXE</text>
  </svg>`
  fs.writeFileSync(path.join(uploadDir, 'mundial-2026-cover.svg'), coverSvg)

  // Láminas Coleccionables estilo Panini / Topps (360x500 con diseño impactante y legible)
  const stickerData = [
    {
      n: 1,
      name: 'ESCUDO FIFA',
      role: 'BRILLANTE',
      team: 'FIFA OFFICIAL',
      col1: '#1e3a8a',
      col2: '#3b82f6',
      icon: '🛡️',
      bgAccent: '#60a5fa',
    },
    {
      n: 2,
      name: 'LIONEL MESSI',
      role: 'CAPITÁN',
      team: 'ARGENTINA #10',
      col1: '#0284c7',
      col2: '#38bdf8',
      icon: '👑',
      bgAccent: '#7dd3fc',
    },
    {
      n: 3,
      name: 'KYLIAN MBAPPÉ',
      role: 'DELANTERO',
      team: 'FRANCE #10',
      col1: '#1d4ed8',
      col2: '#60a5fa',
      icon: '⚡',
      bgAccent: '#93c5fd',
    },
    {
      n: 4,
      name: 'ERLING HAALAND',
      role: 'DELANTERO',
      team: 'NORWAY #9',
      col1: '#0369a1',
      col2: '#0284c7',
      icon: '🤖',
      bgAccent: '#38bdf8',
    },
    {
      n: 5,
      name: 'JUDE BELLINGHAM',
      role: 'MEDIOCAMPO',
      team: 'ENGLAND #10',
      col1: '#374151',
      col2: '#6b7280',
      icon: '⭐',
      bgAccent: '#9ca3af',
    },
    {
      n: 6,
      name: 'VINÍCIUS JÚNIOR',
      role: 'EXTREMO',
      team: 'BRASIL #7',
      col1: '#ca8a04',
      col2: '#eab308',
      icon: '🔥',
      bgAccent: '#fde047',
    },
    {
      n: 7,
      name: 'LAMINE YAMAL',
      role: 'PROMESA',
      team: 'ESPAÑA #19',
      col1: '#b91c1c',
      col2: '#ef4444',
      icon: '💎',
      bgAccent: '#f87171',
    },
    {
      n: 8,
      name: 'DIBU MARTÍNEZ',
      role: 'PORTERO',
      team: 'ARGENTINA #23',
      col1: '#047857',
      col2: '#10b981',
      icon: '🧤',
      bgAccent: '#34d399',
    },
    {
      n: 9,
      name: 'THIBAUT COURTOIS',
      role: 'PORTERO',
      team: 'BELGIUM #1',
      col1: '#0f766e',
      col2: '#14b8a6',
      icon: '🧱',
      bgAccent: '#2dd4bf',
    },
    {
      n: 10,
      name: 'TROFEO MUNDIAL',
      role: 'EDICIÓN ORO',
      team: 'WORLD CHAMPION',
      col1: '#b45309',
      col2: '#f59e0b',
      icon: '🏆',
      bgAccent: '#fde68a',
    },
  ]

  for (const s of stickerData) {
    const isSpecial = s.role === 'BRILLANTE' || s.role === 'CAPITÁN' || s.role === 'EDICIÓN ORO'
    const borderColor = isSpecial ? '#fbbf24' : '#ffffff'
    const borderOpacity = isSpecial ? '0.85' : '0.25'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 500" width="360" height="500">
      <defs>
        <linearGradient id="cardBg${s.n}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${s.col1}"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="foilGrad${s.n}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${s.col2}"/>
          <stop offset="50%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="${s.col2}"/>
        </linearGradient>
        <filter id="cardGlow${s.n}">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="${s.col2}" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Fondo y Borde de Carta Físcia -->
      <rect width="360" height="500" fill="url(#cardBg${s.n})" rx="18"/>
      <rect x="8" y="8" width="344" height="484" fill="none" stroke="${borderColor}" stroke-width="${isSpecial ? '3' : '1.5'}" stroke-opacity="${borderOpacity}" rx="14"/>

      <!-- Header de la Lámina -->
      <rect x="18" y="18" width="324" height="42" fill="#000000" fill-opacity="0.4" rx="8"/>
      <text x="32" y="44" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#94a3b8" letter-spacing="2">STICKDEX 2026</text>
      
      <!-- Badge de Número Grande y Visible -->
      <rect x="278" y="24" width="54" height="30" fill="${isSpecial ? '#fbbf24' : '#ffffff'}" rx="6"/>
      <text x="305" y="45" font-family="ui-monospace, monospace" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle">#${s.n < 10 ? '0' + s.n : s.n}</text>

      <!-- Escenario Central e Icono Grande -->
      <circle cx="180" cy="210" r="105" fill="${s.col2}" opacity="0.12"/>
      <circle cx="180" cy="210" r="85" fill="#000000" fill-opacity="0.3" stroke="${s.col2}" stroke-width="2" stroke-opacity="0.4"/>
      <text x="180" y="242" font-family="system-ui, sans-serif" font-size="96" text-anchor="middle">${s.icon}</text>

      <!-- Badge de Rol / Posición -->
      <g transform="translate(180, 340)">
        <rect x="-70" y="-14" width="140" height="28" fill="${s.col2}" fill-opacity="0.25" stroke="${s.col2}" stroke-width="1.5" rx="14"/>
        <text x="0" y="5" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="${isSpecial ? '#fef08a' : '#ffffff'}" text-anchor="middle" letter-spacing="1.5">${s.role}</text>
      </g>

      <!-- Banner Inferior de Nombre (GRANDE, LEGIBLE Y DESTACADO) -->
      <rect x="20" y="380" width="320" height="95" fill="#000000" fill-opacity="0.65" rx="12" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
      
      <!-- Nombre del Jugador en Tipografía Impactante -->
      <text x="180" y="420" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${s.name}</text>
      
      <!-- Subtítulo de Equipo / País -->
      <text x="180" y="450" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="2">${s.team}</text>
      
      <!-- Detalle holográfico para especiales -->
      ${isSpecial ? `<line x1="60" y1="462" x2="300" y2="462" stroke="#fbbf24" stroke-width="2" stroke-opacity="0.8"/>` : ''}
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
  console.log('Iniciando seed de la base de datos...')

  const uploadDir = path.join(process.cwd(), 'uploads')
  ensureSampleImages(uploadDir)
  console.log('OK: Imágenes muestra vectoriales creadas en uploads/')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Usuarios de prueba
  const user1 = await getOrCreateUser('coleccionista1', 'cole1@test.com', hashedPassword)
  const user2 = await getOrCreateUser('coleccionista2', 'cole2@test.com', hashedPassword)

  console.log('OK: Usuarios disponibles (contraseña: password123):')
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
    { number: 5, name: 'Jude Bellingham', type: 'Mediocampo', imageUrl: '/uploads/sticker-5.svg' },
    { number: 6, name: 'Vinícius Júnior', type: 'Extremo', imageUrl: '/uploads/sticker-6.svg' },
    { number: 7, name: 'Lamine Yamal', type: 'Promesa', imageUrl: '/uploads/sticker-7.svg' },
    { number: 8, name: 'Dibu Martínez', type: 'Portero', imageUrl: '/uploads/sticker-8.svg' },
    { number: 9, name: 'Thibaut Courtois', type: 'Portero', imageUrl: '/uploads/sticker-9.svg' },
    {
      number: 10,
      name: 'Trofeo del Mundial',
      type: 'Especial',
      imageUrl: '/uploads/sticker-10.svg',
    },
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
    console.log('OK: Álbum "Mundial 2026" creado con 10 láminas')
  } else {
    // Actualizar portada, totalStickers, dueño y fotos de láminas existentes
    await prisma.album.update({
      where: { id: album.id },
      data: {
        totalStickers: 10,
        description: 'Álbum oficial de la Copa Mundial FIFA 2026',
        stickerType: 'Fútbol',
        imageUrl: albumCoverUrl,
        releaseDate: new Date('2026-06-01'),
        userId: user1.id,
      },
    })

    for (const s of stickersPayload) {
      const existingSticker = await prisma.sticker.findFirst({
        where: { albumId: album.id, number: s.number },
      })
      if (existingSticker) {
        await prisma.sticker.update({
          where: { id: existingSticker.id },
          data: {
            name: s.name,
            type: s.type,
            imageUrl: s.imageUrl,
          },
        })
      } else {
        await prisma.sticker.create({
          data: { ...s, albumId: album.id },
        })
      }
    }
    console.log('OK: Álbum y láminas actualizados con diseño deluxe e imágenes')
  }

  // 3. Colección de prueba para coleccionista1 (estado documentado en el README)
  const albumStickers = await prisma.sticker.findMany({
    where: { albumId: album.id },
    orderBy: { number: 'asc' },
  })

  if (albumStickers.length < 5) {
    console.warn('Aviso: se necesitan al menos 5 láminas para crear la colección de prueba')
  } else {
    const existingCol = await prisma.collection.findFirst({
      where: { userId: user1.id, albumId: album.id },
    })

    const collection = existingCol
      ? await prisma.collection.update({
          where: { id: existingCol.id },
          data: { name: 'Mi Álbum del Mundial', isPublic: true },
        })
      : await prisma.collection.create({
          data: {
            name: 'Mi Álbum del Mundial',
            albumId: album.id,
            userId: user1.id,
            isPublic: true,
          },
        })

    // Se reinicia el estado para que el seed sea reproducible: 5 pegadas, 2 repetidas, 5 faltantes.
    await prisma.$transaction([
      prisma.collectedSticker.deleteMany({ where: { collectionId: collection.id } }),
      prisma.collectedSticker.createMany({
        data: [
          {
            collectionId: collection.id,
            stickerId: albumStickers[0].id,
            quantity: 1,
            isDuplicated: false,
          },
          {
            collectionId: collection.id,
            stickerId: albumStickers[1].id,
            quantity: 2,
            isDuplicated: true,
          },
          {
            collectionId: collection.id,
            stickerId: albumStickers[2].id,
            quantity: 1,
            isDuplicated: false,
          },
          {
            collectionId: collection.id,
            stickerId: albumStickers[3].id,
            quantity: 3,
            isDuplicated: true,
          },
          {
            collectionId: collection.id,
            stickerId: albumStickers[4].id,
            quantity: 1,
            isDuplicated: false,
          },
        ],
      }),
    ])

    console.log('OK: Colección de prueba lista (5 láminas pegadas, 2 repetidas, 5 faltantes)')
  }

  console.log('Seed completado exitosamente.')
}

main()
  .catch((e) => {
    console.error('Error ejecutando seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
