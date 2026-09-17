# StickDex 

Sistema web fullstack para coleccionistas de láminas de álbumes. Permite crear álbumes con sus catálogos de láminas (con foto y carga masiva), gestionar colecciones personales con cálculo de progreso en tiempo real (%), y obtener reportes automáticos de láminas faltantes y láminas repetidas para intercambio.

**Documentación:** [`docs/brief.md`](docs/brief.md) (especificación y Definition of Done) · [`docs/informe-tecnico.md`](docs/informe-tecnico.md) (informe técnico detallado: arquitectura, capas del backend y del frontend, flujos de trabajo y decisiones de diseño).

---

## Stack Tecnológico

### Backend (`app/backend`)
- **Runtime & Servidor:** Node.js, Express.js
- **Lenguaje:** TypeScript (Strict Mode)
- **Base de Datos & ORM:** MySQL 8, Prisma ORM
- **Validación de Entradas:** Zod (body, query y params; mensajes en español)
- **Seguridad & Sesiones:** `bcryptjs` (hash de contraseñas), `express-session` (cookies `httpOnly` + `sameSite`, store persistente en MySQL, sin JWT)
- **Carga de Archivos:** Multer (validación de MIME, extensión derivada del MIME y límite de tamaño a 5 MB)
- **Calidad de Código:** ESLint 10 + Prettier 3 y alias de importación `@/` → `src/`
- **Pruebas:** Vitest (servicios y validaciones con dobles en memoria, sin base de datos)

### Frontend (`app/frontend`)
- **Librería UI:** React 18, TypeScript (Strict Mode)
- **Estilos:** TailwindCSS
- **Validación de Formularios:** Zod (espejo de los esquemas del backend)
- **Build Tool:** Vite
- **Enrutamiento:** `react-router` (v7)
- **Calidad de Código:** ESLint 10 + Prettier 3 y alias de importación `@/` → `src/`

### Infraestructura
- **Contenedores:** Docker & Docker Compose para el stack completo (MySQL 8 + backend + frontend) con *health checks* por servicio.

---

## Arquitectura y Principios de Diseño

El backend implementa una **Arquitectura MVC Limpia** con separación estricta de responsabilidades:

```
HTTP Request ──► Middleware (Auth / Zod / Multer) ──► Controller ──► Service ──► Repository (Prisma) ──► MySQL
                                                                                   │
HTTP Response ◄────────────────────── Controller ◄───────────── Service ◄──────────┘
```

- **Controller:** Maneja requests y responses HTTP, valida tipos y status codes. Son clases con el servicio inyectado por constructor.
- **Service:** Contiene la lógica y reglas de negocio puras (progreso, autoría, visibilidad). No conoce `req`/`res` ni Prisma.
- **Repository:** Única capa con acceso directo a Prisma Client y persistencia de datos. Sin reglas de negocio.
- **Interfaces + inyección por constructor:** `src/interfaces/` declara `I*Repository` / `I*Service`; las implementaciones (`Prisma*Repository`, `*Service`) se eligen en la raíz de composición `src/config/container.ts` y se inyectan por constructor (Principio de Inversión de Dependencias).
- **SOLID:** Responsabilidad Única (SRP), Inversión de Dependencias (DIP) y segregación de interfaces (una interfaz por agregado).
- **Errores estandarizados:** todas las respuestas de error usan `{ error, message, details? }` con el status correcto (400, 401, 403, 404, 409, 413, 500); las rutas inexistentes también responden JSON.
  - `details` de validación: `{ source: 'body' | 'query' | 'params' | 'file', fieldErrors, issues: [{ path, message }] }`.
  - Los errores de Prisma se traducen: `P2002` → 409 (dato duplicado), `P2003` → 409 (relación violada), `P2025` → 404.
- **Sesiones persistentes:** `express-session` guarda la sesión en la tabla `Session` de MySQL (modelo Prisma), por lo que sobrevive a los reinicios del servidor; cookie `httpOnly`, `sameSite=lax`, `maxAge` 7 días.
- **Seguridad:**
  - Rutas de mutación protegidas con middleware `requireAuth`.
  - Autorización por propiedad: solo el creador puede editar o eliminar sus álbumes, láminas y colecciones (HTTP 403). Un álbum sin dueño (`userId` nulo) no es mutable por nadie.
  - Visibilidad `isPublic`: colecciones privadas solo accesibles por su dueño; al listar colecciones ajenas solo se devuelven las públicas.
  - Imágenes: MIME permitido (JPEG/PNG/WEBP/GIF) y la extensión del archivo guardado se deriva del MIME, nunca del nombre original.

---

## Estructura del Proyecto

```
StickDex/
├── README.md               # Documentación general del proyecto
├── AGENTS.md               # Protocolo operativo de desarrollo
├── docs/
│   ├── brief.md            # Especificación completa y requerimientos
│   └── informe-tecnico.md  # Informe técnico detallado (arquitectura, capas del backend y del frontend, flujos)
├── app/
│   ├── docker-compose.yml  # Stack completo: MySQL + backend + frontend, con health checks
│   ├── backend/
│   │   ├── Dockerfile             # Imagen del backend (build + migraciones al arrancar)
│   │   ├── .dockerignore
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Modelos de datos y relaciones (incluye Session)
│   │   │   ├── seed.ts            # Datos de prueba reproducibles
│   │   │   └── migrations/        # Historial de migraciones SQL
│   │   ├── src/
│   │   │   ├── config/            # Env (Zod), Prisma Client, sesión, container.ts (composición)
│   │   │   ├── controllers/       # Capa HTTP (Auth, Album, Sticker, Collection, Upload, Health)
│   │   │   ├── interfaces/        # I*Repository / I*Service (contratos por agregado)
│   │   │   ├── middlewares/       # Error handler, Zod validator, Auth, Multer, 404
│   │   │   ├── repositories/      # Única capa con Prisma Client
│   │   │   ├── routes/            # Montaje declarativo de endpoints REST
│   │   │   ├── services/          # Lógica de dominio y reglas de negocio
│   │   │   ├── utils/             # Helpers (asyncHandler, HttpError, sessionUserId)
│   │   │   ├── validations/       # Esquemas Zod y mensajes de error en español
│   │   │   ├── types/             # Tipos ambientales (sesión de express-session)
│   │   │   ├── app.ts             # Configuración de Express, /health y archivos estáticos
│   │   │   └── server.ts          # Arranque del servidor HTTP
│   │   ├── tests/                 # Pruebas Vitest con dobles en memoria
│   │   └── uploads/               # Imágenes subidas (compartida con el contenedor)
│   └── frontend/
│       ├── Dockerfile             # Build con Vite y servido estático con Nginx
│       ├── nginx.conf             # SPA + proxy de /api y /uploads + /healthz
│       ├── .dockerignore
│       ├── src/
│       │   ├── components/        # Navbar, Layout y elementos reutilizables
│       │   ├── context/           # AuthContext (gestión de sesión de usuario)
│       │   ├── pages/             # Vistas (Login, Register, Albums, Collections, Profile, UserProfile)
│       │   ├── routes/            # Configuración de react-router y RequireAuth
│       │   ├── hooks/             # Reservado para hooks personalizados
│       │   ├── services/          # Cliente HTTP API con credenciales
│       │   ├── types/             # Interfaces TypeScript compartidas
│       │   └── validations/       # Esquemas Zod espejo de los del backend
│       ├── src/App.tsx, main.tsx, index.css  # Composición, montaje y estilos globales
│       ├── tailwind.config.js
│       └── vite.config.ts         # Configuración Vite con proxy hacia /api
```

---

## Requisitos Previos

- **Node.js** (v20 o superior) y **npm**
- **Docker** y **Docker Compose**

---

## Cómo Levantar el Proyecto

### Opción A — Todo el stack con Docker Compose (recomendado)

Un solo comando construye y levanta **base de datos + backend + frontend**, con *health checks* para
arrancar en orden y comprobar que cada servicio está listo:

```bash
cd app
docker compose up -d --build

# Estado y salud de cada servicio
docker compose ps

# Registros (sigue el arranque: migraciones y servidor)
docker compose logs -f backend
```

| Servicio | Contenedor | URL | Health check |
|---|---|---|---|
| `db` | MySQL 8 | `localhost:3306` | `mysqladmin ping` |
| `backend` | Node 22 + Express compilado | `http://localhost:3000` | `GET /health` (comprueba MySQL) |
| `frontend` | Nginx sirviendo el bundle de Vite | `http://localhost:5173` | `GET /healthz` |

Cuando los tres aparecen como `(healthy)` la aplicación está lista en `http://localhost:5173`.
El backend aplica las migraciones pendientes al arrancar (`prisma migrate deploy`).

Datos de demostración (una sola vez, con el stack arriba):

```bash
docker compose exec backend npm run prisma:seed
```

Comandos útiles:

```bash
docker compose ps                 # estado y salud
docker compose logs -f backend    # registros del backend
docker compose down               # detener (conserva la base de datos)
docker compose down -v            # detener y borrar el volumen de MySQL
```

El stack se configura por variables de entorno con valores por defecto, así que funciona sin crear
ningún archivo. Si quieres cambiarlos, crea `app/.env` (por ejemplo `SESSION_SECRET`, `MYSQL_*`,
`NODE_ENV`). Con `NODE_ENV=production` la cookie de sesión se marca `secure` y requiere HTTPS.

### Opción B — Modo desarrollo con dos terminales

Útil para trabajar con recarga en caliente. Primero la base de datos con Docker:

```bash
cd app
docker compose up -d db
```

**Backend** (`app/backend`):

```bash
cp .env.example .env      # DATABASE_URL, SESSION_SECRET (32+), PORT, NODE_ENV
npm install               # instala y genera el cliente de Prisma (postinstall)
npx prisma migrate dev    # aplica las migraciones
npm run prisma:seed       # datos de demostración
npm run dev               # http://localhost:3000
```

**Frontend** (`app/frontend`):

```bash
npm install
npm run dev               # http://localhost:5173 (proxy hacia /api y /uploads)
```

> Nota: el backend en Docker y el de desarrollo comparten la misma carpeta `app/backend/uploads`,
> por lo que las imágenes subidas y las del seed se ven igual desde cualquiera de los dos modos.

---

## Datos de Prueba (Seed)

Para probar la aplicación inmediatamente sin tener que registrarse o crear datos manualmente, ejecuta:

```bash
cd app/backend
npm run prisma:seed
```

El seed es **idempotente y reproducible**: actualiza el álbum de demo (y lo asigna a `coleccionista1`) y reinicia la colección de prueba al estado documentado (5 láminas pegadas, 2 repetidas y 5 faltantes), de modo que puedes volver a ejecutarlo tras hacer pruebas manuales.

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

## Endpoints de la API REST

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
| `POST` | `/upload` | Subir imagen JPEG/PNG/WEBP/GIF (máx. 5MB, requiere sesión). El archivo se guarda con la extensión derivada del MIME, nunca la del nombre original |

### Estado del servicio
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Salud del backend y de su base de datos: `{ "status": "ok", "database": "up" }`. Si MySQL no responde devuelve `503` con `database: "down"`. Está fuera de `/api` y es el endpoint que consulta el health check de Docker Compose |

### Formato de errores

Todas las respuestas de error siguen el mismo contrato:

```json
{
  "error": "bad_request",
  "message": "Entrada inválida",
  "details": {
    "source": "body",
    "fieldErrors": { "name": ["Este campo es obligatorio"] },
    "issues": [{ "path": "name", "message": "Este campo es obligatorio" }]
  }
}
```

Códigos usados: `400` validación, JSON malformado, archivo demasiado grande (`file_too_large`) o subida rechazada (`upload_error`); `401` sin sesión o credenciales inválidas; `403` recurso ajeno o colección privada; `404` recurso o ruta inexistente; `409` dato duplicado; `413` cuerpo de la petición demasiado grande (`payload_too_large`); `500` error interno; `503` servicio no disponible (solo en `/health`, cuando MySQL no responde).

## Rutas del frontend

| Ruta | Acceso | Vista |
|---|---|---|
| `/` y `*` | público | Redirigen a `/albums` |
| `/login`, `/register` | público | Autenticación |
| `/albums`, `/albums/:id` | público | Catálogo de álbumes y detalle con sus láminas |
| `/collections`, `/collections/:id` | público (detalle privado solo para su dueño) | Colecciones, progreso, faltantes y repetidas |
| `/users/:id` | público | Perfil de coleccionista con sus colecciones públicas |
| `/profile` | requiere sesión | Colecciones propias (públicas y privadas) |

Las acciones de escritura (crear/editar/eliminar) solo se muestran al dueño del recurso y a usuarios con sesión; el servidor vuelve a verificarlo en cada petición.

---

## Verificación y Scripts Disponibles

### Backend (`app/backend`)
- `npm run dev`: Inicia el backend en modo watch con `tsx`.
- `npm run build`: Compila TypeScript a JavaScript en `dist/` (reescribe el alias `@/`).
- `npm run typecheck`: Verifica tipos estáticos (incluye `tests/`).
- `npm run lint`: ESLint sobre todo el paquete.
- `npm run format` / `npm run format:check`: Prettier.
- `npm test`: Ejecuta la suite de Vitest (sin base de datos).
- `npx prisma studio`: Interfaz web visual para explorar la base de datos MySQL.

### Frontend (`app/frontend`)
- `npm run dev`: Servidor de desarrollo con Hot Module Replacement (Vite).
- `npm run build`: Genera el bundle de producción optimizado en `dist/`.
- `npm run typecheck`: Comprobación de tipos estáticos en frontend.
- `npm run lint`: ESLint sobre todo el paquete.
- `npm run format` / `npm run format:check`: Prettier.

### Verificación ejecutada sobre este repositorio

- Backend: `npm run typecheck`, `npm run lint`, `npm run format:check` y `npm test` (120 pruebas, sin base de datos).
- Frontend: `npm run typecheck`, `npm run lint` y `npm run format:check`.
- Pruebas de humo ejecutadas manualmente sobre la aplicación real (no se versiona el script): 48 comprobaciones contra la API (login, autorización por propiedad, visibilidad, reportes, conflictos 409, subidas) y recorrido de la interfaz en un navegador (login/logout, rutas protegidas, perfil público, edición de álbum y lámina, validación inline, progreso y repetidas).
