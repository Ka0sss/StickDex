# StickDex 📖✨

Sistema web fullstack para coleccionistas de láminas de álbumes. Permite crear álbumes con sus catálogos de láminas (con foto y carga masiva), gestionar colecciones personales con cálculo de progreso en tiempo real (%), y obtener reportes automáticos de láminas faltantes y láminas repetidas para intercambio.

---

## 🚀 Stack Tecnológico

### Backend (`app/backend`)
- **Runtime & Servidor:** Node.js, Express.js
- **Lenguaje:** TypeScript (Strict Mode)
- **Base de Datos & ORM:** MySQL 8, Prisma ORM
- **Validación de Entradas:** Zod
- **Seguridad & Sesiones:** `bcryptjs` (hash de contraseñas), `express-session` (cookies `httpOnly`, sin JWT)
- **Carga de Archivos:** Multer (con validación de tipos MIME y límite de tamaño a 5 MB)

### Frontend (`app/frontend`)
- **Librería UI:** React 18, TypeScript
- **Estilos:** TailwindCSS
- **Build Tool:** Vite
- **Enrutamiento:** `react-router` (v7)

### Infraestructura
- **Contenedores:** Docker & Docker Compose para el servicio de MySQL 8.

---

## 🏛️ Arquitectura y Principios de Diseño

El backend implementa una **Arquitectura MVC Limpia** con separación estricta de responsabilidades:

```
HTTP Request ──► Middleware (Auth / Zod / Multer) ──► Controller ──► Service ──► Repository (Prisma) ──► MySQL
                                                                                   │
HTTP Response ◄────────────────────── Controller ◄───────────── Service ◄──────────┘
```

- **Controller:** Maneja requests y responses HTTP, valida tipos y status codes.
- **Service:** Contiene la lógica y reglas de negocio puras (progreso, autoría, visibilidad).
- **Repository:** Única capa con acceso directo a Prisma Client y persistencia de datos.
- **SOLID:** Principio de Responsabilidad Única (SRP), Inversión de Dependencias (DIP) y segregación de interfaces.
- **Seguridad:**
  - Rutas de mutación protegidas con middleware `requireAuth`.
  - Autorización por propiedad: solo el creador puede editar o eliminar sus álbumes, láminas y colecciones (HTTP 403).
  - Visibilidad `isPublic`: colecciones privadas solo accesibles por su dueño; públicas visibles por toda la comunidad.

---

## 📁 Estructura del Proyecto

```
StickDex/
├── README.md               # Documentación general del proyecto
├── AGENTS.md               # Protocolo operativo de desarrollo
├── docs/
│   └── brief.md            # Especificación completa y requerimientos
├── app/
│   ├── docker-compose.yml  # Configuración del servicio MySQL
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Modelos de datos y relaciones
│   │   │   └── migrations/        # Historial de migraciones SQL
│   │   ├── src/
│   │   │   ├── config/            # Variables de entorno (Zod) y Prisma Client
│   │   │   ├── controllers/       # Capa HTTP (Auth, Album, Sticker, Collection)
│   │   │   ├── middlewares/       # Error handler, Zod validator, Auth, Multer
│   │   │   ├── repositories/      # Consultas y operaciones Prisma
│   │   │   ├── routes/            # Definición y montaje de endpoints REST
│   │   │   ├── services/          # Lógica de dominio y reglas de negocio
│   │   │   ├── utils/             # Helpers (asyncHandler, HttpError)
│   │   │   ├── validations/       # Esquemas de validación Zod
│   │   │   ├── app.ts             # Configuración de Express y archivos estáticos
│   │   │   └── server.ts          # Arranque del servidor HTTP
│   │   └── uploads/               # Directorio local de imágenes subidas
│   └── frontend/
│       ├── src/
│       │   ├── components/        # Navbar, Layout y elementos reutilizables
│       │   ├── context/           # AuthContext (gestión de sesión de usuario)
│       │   ├── pages/             # Vistas (Login, Register, Albums, Collections)
│       │   ├── routes/            # Configuración de react-router
│       │   ├── services/          # Cliente HTTP API con credenciales
│       │   └── types/             # Interfaces TypeScript compartidas
│       ├── tailwind.config.js
│       └── vite.config.ts         # Configuración Vite con proxy hacia /api
```

---

## 📋 Requisitos Previos

- **Node.js** (v20 o superior) y **npm**
- **Docker** y **Docker Compose**

---

## 🛠️ Cómo Levantar el Proyecto

### 1. Iniciar la Base de Datos con Docker

Desde el directorio `app/`:

```bash
cd app
docker compose up -d
```

Verifica que el contenedor esté corriendo con `docker compose ps`.

### 2. Configurar y Levantar el Backend

Abre una terminal y navega a `app/backend`:

```bash
cd app/backend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Aplicar las migraciones de Prisma
npx prisma migrate dev

# Cargar datos de prueba (seed de usuarios, álbum y colección)
npm run prisma:seed
# Iniciar en modo desarrollo
npm run dev
```

El servidor estará escuchando en `http://localhost:3000`.

### 3. Configurar y Levantar el Frontend

Abre otra terminal y navega a `app/frontend`:

```bash
cd app/frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo Vite
npm run dev
```

La aplicación web estará disponible en `http://localhost:5173`.

---

## 👥 Datos de Prueba (Seed)

Para probar la aplicación inmediatamente sin tener que registrarse o crear datos manualmente, ejecuta:

```bash
cd app/backend
npm run prisma:seed
```

### Credenciales de acceso

| Usuario | Email | Contraseña | Descripción |
|---|---|---|---|
| `coleccionista1` | `cole1@test.com` | `password123` | Creador del álbum "Mundial 2026" y dueño de colección con progreso (50%) |
| `coleccionista2` | `cole2@test.com` | `password123` | Usuario alternativo para probar permisos 403 y visibilidad comunitaria |

### Datos precargados en la BD

- **Álbum:** "Mundial 2026" con 10 láminas creadas (Escudo FIFA, Messi, Mbappé, Haaland, Bellingham, Yamal, Trofeo, etc.).
- **Colección:** "Mi Álbum del Mundial" para `coleccionista1` con:
  - **Progreso:** 50% (5 láminas de 10).
  - **Láminas repetidas:** Lionel Messi (x2 copias) y Erling Haaland (x3 copias).
  - **Láminas faltantes:** Vinícius, Yamal, Martínez, Courtois y Trofeo.

---

## 📡 Endpoints de la API REST

Base URL: `http://localhost:3000/api`

### Autenticación (`/auth`)
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de nuevo coleccionista |
| `POST` | `/auth/login` | Inicio de sesión (crea cookie de sesión) |
| `POST` | `/auth/logout` | Cierre de sesión y destrucción de cookie |
| `GET` | `/auth/me` | Retorna el usuario autenticado actual |

### Álbumes (`/albums`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/albums` | Catálogo de álbumes |
| `GET` | `/albums/:id` | Detalle del álbum con sus láminas |
| `POST` | `/albums` | Crear álbum (requiere sesión) |
| `PUT` | `/albums/:id` | Editar álbum (solo el creador) |
| `DELETE` | `/albums/:id` | Eliminar álbum (solo el creador) |

### Láminas (`/albums/:albumId/stickers` y `/stickers/:id`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/albums/:albumId/stickers` | Listar láminas de un álbum |
| `POST` | `/albums/:albumId/stickers` | Crear lámina con foto opcional (solo creador) |
| `POST` | `/albums/:albumId/stickers/bulk` | Carga masiva de láminas (solo creador) |
| `PUT` | `/stickers/:id` | Editar lámina (solo creador) |
| `DELETE` | `/stickers/:id` | Eliminar lámina (solo creador) |

### Colecciones (`/collections`)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/collections` | Listar colecciones (públicas o del usuario) |
| `GET` | `/collections/:id` | Detalle de colección con porcentaje de progreso |
| `POST` | `/collections` | Iniciar nueva colección (requiere sesión) |
| `PUT` | `/collections/:id` | Modificar colección / visibilidad pública |
| `DELETE` | `/collections/:id` | Eliminar colección (solo el creador) |
| `POST` | `/collections/:id/stickers` | Pegar lámina en la colección |
| `PUT` | `/collections/:id/stickers/:stickerId` | Actualizar cantidad o marcar repetida |
| `DELETE` | `/collections/:id/stickers/:stickerId` | Quitar lámina de la colección |
| `GET` | `/collections/:id/missing` | Reporte de láminas faltantes |
| `GET` | `/collections/:id/duplicates` | Reporte de láminas repetidas con cantidades |

### Carga de Archivos (`/upload`)
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/upload` | Subir imagen JPEG/PNG/WEBP (máx. 5MB, requiere sesión) |

---

## 🧪 Verificación y Scripts Disponibles

### Backend (`app/backend`)
- `npm run dev`: Inicia el backend en modo watch con `tsx`.
- `npm run build`: Compila TypeScript a JavaScript en `dist/`.
- `npm run typecheck`: Verifica tipos estáticos con `tsc --noEmit`.
- `npx prisma studio`: Interfaz web visual para explorar la base de datos MySQL.

### Frontend (`app/frontend`)
- `npm run dev`: Servidor de desarrollo con Hot Module Replacement (Vite).
- `npm run build`: Genera el bundle de producción optimizado en `dist/`.
- `npm run typecheck`: Comprobación de tipos estáticos en frontend.
