# Brief — Sistema de Gestión de Colecciones de Láminas

## 1. Descripción del proyecto

Plataforma web para coleccionistas de láminas de álbumes. Permite:

- **Gestionar colecciones**: registrar qué láminas posee cada usuario, marcar repetidas y ver el progreso.
- **Crear álbumes**: definir álbumes con su catálogo de láminas (número, nombre, imagen).
- **Subir láminas**: cargar imágenes y metadatos de cada lámina.
- **Visibilidad pública**: otros usuarios pueden ver las colecciones de cada coleccionista.

Es un proyecto **fullstack** cuyo código vive en el directorio `app/`, dividido en `backend/` y `frontend/`.

## 2. Objetivos

1. Permitir registro e inicio de sesión de usuarios.
2. CRUD de álbumes y láminas asociadas.
3. Gestión de colecciones por usuario (añadir/quitar láminas, marcar repetidas).
4. Perfil público de coleccionista consultable por otros usuarios.
5. Código mantenible, testeable y escalable bajo una arquitectura limpia.

## 3. Funcionalidades (casos de uso)

| Área | Caso de uso |
|------|-------------|
| Auth | Registro, login, logout, sesión persistente |
| Álbumes | Crear, editar, eliminar, listar, detallar |
| Láminas | Subir imagen + metadatos, editar, eliminar, listar por álbum, carga masiva (listado) |
| Colecciones | Crear colección, añadir/quitar láminas, marcar repetidas, ver progreso, reporte de faltantes y repetidas |
| Perfil público | Ver colecciones de otros usuarios |

## 4. Stack tecnológico

### Backend (`app/backend`)

| Tecnología | Uso |
|------------|-----|
| Node.js + Express.js | Servidor HTTP / API REST |
| TypeScript | Tipado estático |
| Prisma ORM + MySQL | Acceso a datos |
| Zod | Validación de entrada (body, query, params, env) |
| bcryptjs | Hash de contraseñas |
| express-session | Sesiones de usuario (cookie + store) |

### Frontend (`app/frontend`)

| Tecnología | Uso |
|------------|-----|
| React + TypeScript | UI |
| TailwindCSS | Estilos |
| Vite | Build / dev server |
| react-router | Enrutado SPA |

### Infraestructura

| Tecnología | Uso |
|------------|-----|
| Docker + Docker Compose | Levantar MySQL (y opcionalmente backend/frontend) |

## 5. Estructura de directorios

```
app/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (env, prisma, session)
│   │   ├── controllers/     # Capa HTTP: request/response
│   │   ├── services/        # Lógica de negocio
│   │   ├── repositories/    # Acceso a datos (Prisma)
│   │   ├── routes/          # Definición de rutas
│   │   ├── middlewares/     # Auth, errores, validación
│   │   ├── validations/     # Esquemas Zod
│   │   ├── utils/           # Helpers (asyncHandler, errors)
│   │   ├── app.ts           # Configura Express
│   │   └── server.ts        # Arranque
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Vistas por ruta
│   │   ├── routes/          # Configuración react-router
│   │   ├── services/        # Cliente HTTP (API)
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── types/           # Tipos compartidos
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── docker-compose.yml
```

## 6. Arquitectura MVC limpia

Flujo de una petición:

```
HTTP Request → Middleware (auth/validación) → Controller → Service → Repository (Prisma) → DB
                                                              ↓
HTTP Response ← Controller ← Service ← Repository
```

- **Model (Repository/Prisma)**: acceso a datos. Nada de lógica de negocio.
- **View (frontend React)**: presentación. Consume la API, no conoce la lógica de negocio.
- **Controller**: interpreta HTTP, valida entrada con Zod, delega al servicio, responde.
- **Service**: lógica de negocio pura, orquestación, reglas de dominio.
- **Middleware**: autenticación, manejo de errores, validación.

Reglas clave:

- Controller **no** contiene lógica de negocio.
- Service **no** toca `req`/`res` ni Prisma directamente (usa repositorios).
- Repository es la **única** capa que habla con Prisma.
- Las validaciones de entrada se declaran con Zod en `validations/`.

## 7. Principios SOLID

| Principio | Aplicación |
|-----------|------------|
| **S — Single Responsibility** | Cada capa tiene una sola razón de cambiar: controller → HTTP, service → negocio, repository → datos |
| **O — Open/Closed** | Extender comportamiento añadiendo servicios/repositorios, sin modificar los existentes |
| **L — Liskov Substitution** | Interfaces (`IUserService`, `IUserRepository`) implementadas de forma intercambiable |
| **I — Interface Segregation** | Interfaces pequeñas y específicas (una por repositorio, no un "repo gigante") |
| **D — Dependency Inversion** | Controllers dependen de interfaces; los servicios se inyectan por constructor |

## 8. Mejores prácticas

- TypeScript en **strict mode**.
- Wrapper `asyncHandler` para eliminar `try/catch` repetido.
- Middleware central de errores con respuestas estandarizadas (`{ error, message, details? }`) y códigos de estado correctos (200, 201, 400, 401, 403, 404, 409, 500).
- Validar variables de entorno con Zod al arrancar.
- Hash de contraseñas con bcryptjs (nunca almacenar en claro).
- Sesiones con `express-session`: cookie `httpOnly`, `sameSite`, secret en env.
- Límite de tamaño en subida de imágenes (multer + validación de tipo).
- ESLint + Prettier para consistencia de estilo.
- Alias de importación (`@/`) para evitar rutas relativas profundas.
- Variables de entorno nunca versionadas (`.env` en `.gitignore`, con `.env.example`).

## 9. Modelo de datos (Prisma — conceptual)

```prisma
model User {
  id          Int          @id @default(autoincrement())
  username    String       @unique
  email       String       @unique
  password    String       // hash bcryptjs
  collections Collection[]
  createdAt   DateTime     @default(now())
}

model Album {
  id            Int       @id @default(autoincrement())
  name          String
  description   String?
  imageUrl      String?   // portada
  releaseDate   DateTime? // fecha de lanzamiento
  stickerType   String?   // tipo de láminas del álbum
  totalStickers Int
  stickers      Sticker[]
  collections   Collection[]
  createdAt     DateTime  @default(now())
}

model Sticker {
  id        Int      @id @default(autoincrement())
  number    Int
  name      String
  imageUrl  String?  // foto opcional
  type      String?  // categoría de la lámina
  albumId   Int
  album             Album              @relation(fields: [albumId], references: [id], onDelete: Cascade)
  collectedStickers CollectedSticker[]
  createdAt         DateTime           @default(now())

  @@unique([albumId, number])
}

model Collection {
  id        Int                @id @default(autoincrement())
  name      String
  isPublic  Boolean            @default(false)
  userId    Int
  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  albumId   Int
  album     Album              @relation(fields: [albumId], references: [id], onDelete: Cascade)
  stickers  CollectedSticker[]
  createdAt DateTime           @default(now())
}

model CollectedSticker {
  id           Int        @id @default(autoincrement())
  collectionId Int
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  stickerId    Int
  sticker      Sticker    @relation(fields: [stickerId], references: [id], onDelete: Cascade)
  quantity     Int        @default(1)
  isDuplicated Boolean    @default(false)

  @@unique([collectionId, stickerId])
}
```

## 10. Seguridad

- **Autenticación**: email + contraseña; contraseña hasheada con `bcryptjs`.
- **Sesión**: `express-session` con cookie firmada `httpOnly` y `sameSite=lax`.
- **Autorización**: middleware que verifica sesión para rutas protegidas.
- **Propiedad de recursos**: un usuario solo edita sus propios álbumes/colecciones.
- **Visibilidad**: `isPublic` controla qué colecciones ven otros usuarios.
- **Entradas**: toda entrada validada con Zod antes de llegar al service.
- **Imágenes**: validar MIME type y tamaño máximo en la subida.

## 11. Validación (Zod)

- Body, query y params de cada endpoint se validan con un esquema Zod.
- Los esquemas viven en `backend/src/validations/`.
- Se reutilizan para inferir tipos TypeScript (`z.infer`).
- Env vars se validan al arranque; el servidor falla temprano si faltan.

## 12. Endpoints API REST

Base: `/api`.

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | `/auth/register` | Registrar usuario y crear sesión |
| POST   | `/auth/login` | Iniciar sesión |
| POST   | `/auth/logout` | Cerrar sesión activa |
| GET    | `/auth/me` | Obtener usuario de la sesión activa |

### Álbumes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/albums` | Listar álbumes |
| GET    | `/albums/:id` | Detalle de un álbum |
| POST   | `/albums` | Crear álbum |
| PUT    | `/albums/:id` | Editar álbum |
| DELETE | `/albums/:id` | Eliminar álbum |

### Láminas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/albums/:albumId/stickers` | Listar láminas de un álbum |
| POST   | `/albums/:albumId/stickers` | Crear lámina (foto opcional) |
| POST   | `/albums/:albumId/stickers/bulk` | Crear un listado de láminas |
| PUT    | `/stickers/:id` | Editar lámina |
| DELETE | `/stickers/:id` | Eliminar lámina |

### Colecciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/collections` | Listar colecciones (filtro opcional: `userId`, `isPublic`) |
| GET    | `/collections/:id` | Detalle de colección con progreso y láminas poseídas |
| POST   | `/collections` | Crear colección para un álbum |
| PUT    | `/collections/:id` | Editar colección (nombre, visibilidad pública) |
| DELETE | `/collections/:id` | Eliminar colección |
| POST   | `/collections/:id/stickers` | Añadir lámina a la colección (o incrementar cantidad) |
| PUT    | `/collections/:id/stickers/:stickerId` | Actualizar cantidad o marcar como repetida |
| DELETE | `/collections/:id/stickers/:stickerId` | Quitar lámina de la colección |
| GET    | `/collections/:id/missing` | Láminas faltantes del álbum |
| GET    | `/collections/:id/duplicates` | Láminas repetidas, con cantidad por lámina |

- **Progreso**: porcentaje y conteo de láminas únicas obtenidas vs total del álbum.
- **Faltantes**: láminas del álbum que no están en la colección.
- **Repetidas**: láminas con más de una copia; la respuesta incluye la cantidad de repetidas por lámina.

## 13. Routing (recomendación)

**Sí, usar `react-router` (paquete `react-router-dom`)** para las rutas del frontend.

Razones:

- Es el estándar de facto para SPAs con React y funciona nativamente con Vite.
- Rutas anidadas y declarativas (`<BrowserRouter>`, `<Routes>`, `<Route>`).
- Rutas protegidas fáciles de implementar con un wrapper que verifique la sesión.
- Manejo de parámetros de URL (`/collections/:id`) sin configuración extra.

Alternativa considerada: **TanStack Router** (type-safe al 100%), pero añade complejidad innecesaria para este alcance. `react-router` es la opción aburrida y estable.

## 14. Docker / Infraestructura

`docker-compose.yml` en `app/` levanta MySQL:

```yaml
services:
  db:
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

Comandos:

```bash
docker compose up -d          # levantar MySQL
npx prisma migrate dev        # aplicar migraciones (desde app/backend)
npx prisma studio             # inspeccionar datos
```

## 15. Definición de hecho (Definition of Done)

- [ ] Registro/login/logout funcionales con sesión persistente.
- [ ] CRUD de álbumes y láminas, con foto opcional por lámina.
- [ ] Carga masiva de láminas (listado).
- [ ] Gestión de colecciones: añadir/quitar láminas, marcar repetidas.
- [ ] Reporte de láminas faltantes y repetidas (con cantidad por lámina).
- [ ] Perfil público con colecciones visibles para otros usuarios.
- [ ] Entradas validadas con Zod y errores estandarizados.
- [ ] Contraseñas hasheadas con bcryptjs.
- [ ] MySQL levantado vía Docker Compose y accesible desde Prisma.
- [ ] Código separado por capas (controller/service/repository) siguiendo SOLID.
- [ ] TypeScript en strict mode sin errores.
