# P0 — StickDex Audit: Refactoring Opportunities and Functional Issues

Fecha de auditoría: 2026-09-17

## 1. Baseline

### Estado del repositorio

- `git status --short` inicial no mostró cambios.
- Últimos commits revisados: `9279edd`, `9772447`, `0fddb6e`, `8ac0c0e`, `fabcb21`, `849d54c`, `5bc15fb`, `bddf5b8`, `73a266d`, `67d677a`.
- Proyecto organizado en `app/backend` y `app/frontend`, con documentación en `README.md`, `docs/brief.md` y `docs/informe-tecnico.md`.
- Package manager: npm (`package-lock.json` en backend y frontend).
- Backend: Express + TypeScript estricto + Prisma/MySQL + Zod + express-session + Multer. Flujo observado: routes → middleware → controllers → services → repositories → Prisma.
- Frontend: React 18 + TypeScript + React Router + Vite + Zod. Formularios controlados con `useState`, validación local mediante `safeParse`, cliente HTTP compartido en `src/services/api.ts`.
- Docker Compose contiene `db`, `backend` y `frontend`; los tres estaban `healthy` durante la inspección.

### Calidad existente

- Backend tiene scripts de typecheck, lint, format check y Vitest.
- Frontend tiene scripts de typecheck, lint, format check y build; no tiene suite de pruebas propia.
- Tests backend cubren validaciones, servicios, auth, errores y session store, pero no rutas HTTP ni filesystem/Multer/seed.
- La documentación declara una suite backend de 120 pruebas y smoke tests manuales previos. Esta auditoría no reprodujo esos números porque las dependencias locales no estaban instaladas.

### Arquitectura y estrategia

- Validación Zod separada en backend y frontend; la duplicación es intencional.
- Errores backend se normalizan como `{ error, message, details? }`; el frontend traduce `fieldErrors` e `issues` mediante `getFieldErrors`/`getIssues`.
- Autorización y visibilidad están centralizadas principalmente en services (`albumAccess`, `collection.service`) y repositories.
- No se observó acceso directo a Prisma desde routes o frontend.

## 2. Confirmed issues

### ISSUE-01

Category: Docker / filesystem / setup
Severity: HIGH
Confidence: CONFIRMED
Files: `app/docker-compose.yml:37-39`, `app/backend/Dockerfile:23-37`, `app/backend/prisma/seed.ts:9-12,68,231,263-264`, `app/backend/src/middlewares/upload.ts:13-16`

Problem: El procedimiento documentado para una copia nueva (`docker compose up -d --build` seguido de `docker compose exec backend npm run prisma:seed`) no permite completar el seed en este entorno Linux con SELinux enforcing.

Evidence:

- Compose monta `./backend/uploads:/app/uploads`.
- La imagen crea `/app/uploads` durante build con `RUN mkdir -p uploads`, pero ese directorio de imagen es reemplazado por el bind mount al arrancar.
- En un clone sin `backend/uploads`, Docker crea el directorio host y lo monta con contexto SELinux `user_home_t`.
- Verificación no destructiva dentro del contenedor: `id` devolvió `uid=0(root) gid=0(root)`, `/app/uploads` devolvió `drwxr-xr-x 755 root:root`, y `ls -Zd /app/uploads` devolvió `system_u:object_r:user_home_t:s0`.
- `getenforce` devolvió `Enforcing`.
- `touch /app/uploads/.p0-write-check` falló con `Permission denied` aunque el proceso era root y el modo POSIX era `755`.
- El seed llama a `fs.writeFileSync(path.join(uploadDir, 'mundial-2026-cover.svg'), coverSvg)` después de `mkdirSync`; el error reportado `EACCES` coincide con la denegación del bind mount, no con una ruta incorrecta.

Likely root cause: El bind mount no recibe una etiqueta SELinux apta para escritura del contenedor (`:z`/`:Z`, según la política de despliegue), y el directorio host creado bajo un árbol de usuario conserva `user_home_t`. El `RUN mkdir -p uploads` de la imagen no puede resolverlo porque Compose sustituye ese path por el montaje host. No hay `USER` explícito en el Dockerfile; el contenedor corre como root, por lo que cambiar únicamente el usuario no explica ni corrige esta reproducción.

User/developer impact: El stack puede aparecer healthy porque el backend arranca sin escribir archivos, pero el paso obligatorio del README falla y no se crean las imágenes ni los datos demo. La aplicación recién levantada queda sin el seed reproducible.

Fresh Linux clone: CONFIRMED for este host/configuración: fresh host `backend/uploads` no existía; Compose creó el bind source y la escritura fue denegada por SELinux. En hosts sin SELinux enforcing el fallo puede no reproducirse, por lo que la configuración no es portable.

Suggested scope: Ajustar únicamente la estrategia de permisos/etiquetado del bind mount y verificar el flujo documentado desde clone limpio. No implementado en P0.

### ISSUE-02

Category: Form semantics / UX correctness
Severity: MEDIUM
Confidence: CONFIRMED
Files: `app/frontend/src/pages/AlbumsList.tsx`, `app/frontend/src/pages/AlbumDetail.tsx`, `app/frontend/src/pages/CollectionDetail.tsx`, `app/frontend/src/components/Navbar.tsx`

Problem: Hay botones dentro de estructuras de formulario que no declaran `type="button"`. En HTML, el tipo por defecto de `<button>` dentro de un `<form>` es `submit`; por tanto, botones de cierre, tabs, confirmación o controles auxiliares pueden disparar submit accidentalmente.

Evidence: El search de `<button` mostró, entre otros, los botones de cierre en `AlbumsList` (línea 318), `AlbumDetail` (líneas 618 y 747) y `CollectionDetail` (líneas 737 y 840) sin `type`. Los botones submit explícitos sí usan `type="submit"`, y algunos cancel usan `type="button"`, demostrando que el comportamiento esperado ya es conocido en el código.

Likely root cause: Omisión puntual del atributo en controles visuales ubicados dentro de formularios modales.

User/developer impact: Cerrar un modal o activar un control auxiliar puede ejecutar validación, limpiar errores o enviar datos inesperadamente; el efecto depende del árbol exacto del modal.

Suggested scope: Añadir `type="button"` solamente a controles no-submit dentro de formularios y comprobar cada modal.

### ISSUE-03

Category: Error handling / UX
Severity: MEDIUM
Confidence: CONFIRMED
Files: `app/frontend/src/pages/CollectionDetail.tsx:72-76`

Problem: Los endpoints de reportes de faltantes y repetidas convierten cualquier error en listas vacías con `.catch(() => [])`.

Evidence: `Promise.all` llama a `/collections/:id/missing` y `/collections/:id/duplicates`; cada promesa tiene `.catch(() => [])`. El componente luego renderiza esos arrays sin indicador de fallo.

Likely root cause: Intento de mantener visible el detalle aunque falle un reporte, sin conservar el motivo del fallo.

User/developer impact: Error 401/403/404/500 o caída temporal de API se presenta como “0 faltantes” o “0 repetidas”, dato falso y difícil de diagnosticar.

Suggested scope: Conservar error por reporte o fallar la carga de forma visible; no cambiar reglas de autorización.

### ISSUE-04

Category: Error handling / UX
Severity: LOW
Confidence: CONFIRMED
Files: `app/frontend/src/pages/CollectionsList.tsx:55-63`

Problem: La carga de álbumes para el modal de creación ignora cualquier error silenciosamente (`catch { /* Ignore */ }`).

Evidence: `loadAlbums` captura el error sin actualizar `error`, `modalError` ni estado de disponibilidad. El botón puede abrir un modal sin opciones y el submit termina mostrando solo el error de validación para `albumId`.

Likely root cause: Error de datos auxiliares tratado como condición vacía.

User/developer impact: Usuario no sabe si no existen álbumes o si falló la API; diagnóstico y recuperación pobres.

Suggested scope: Exponer error de carga y deshabilitar/explicar el formulario cuando no se pudo cargar el catálogo.

## 3. Form / field findings

### FORM-01

Files: `AlbumsList.tsx`, `AlbumDetail.tsx`, `CollectionDetail.tsx`

Form/field: Botones de cierre y controles auxiliares dentro de modales con formulario.

Current behavior: Varios `<button>` no declaran `type`; los submit sí lo declaran explícitamente.

Expected behavior based on backend/schema: Cierre, tabs, confirmaciones y acciones no relacionadas con envío no deben ejecutar los esquemas ni las mutaciones del formulario.

Problem: Semántica HTML por defecto puede tratar esos botones como submit.

Risk: Medio; envío accidental, validaciones inesperadas y pérdida de contexto del usuario.

Suggested correction: `type="button"` en cada control no-submit; mantener `type="submit"` solo en acciones de envío.

### FORM-02

Files: `CollectionDetail.tsx:72-76`

Form/field: Reportes de faltantes/repetidas asociados al detalle.

Current behavior: Cualquier error de ambos endpoints se transforma en `[]`.

Expected behavior based on API error contract: Errores HTTP deben conservar mensaje/estado y mostrarse, no convertirse en resultado válido vacío.

Problem: El usuario recibe un reporte potencialmente falso.

Risk: Medio; decisiones de intercambio basadas en datos incompletos.

Suggested correction: Estado de error separado por reporte o mensaje general de carga parcial.

### FORM-03

Files: `CollectionsList.tsx:55-63,78-87`

Form/field: Selector `albumId` del formulario de nueva colección.

Current behavior: Si falla `GET /albums`, el error se ignora; `selectedAlbumId` puede permanecer `''`; el submit convierte a `Number('')` (`0`) y la validación local falla como `albumId` inválido.

Expected behavior based on schema: `albumId` debe ser entero positivo existente.

Problem: El mensaje visible describe un campo inválido, no la causa real: catálogo no cargado.

Risk: Bajo/medio; confusión y ausencia de recuperación.

Suggested correction: Registrar error de carga, mostrarlo en el modal y bloquear submit mientras el catálogo no esté disponible.

### FORM-04

Files: `AlbumsList.tsx`, `AlbumDetail.tsx`, `CollectionDetail.tsx`, `Login.tsx`, `Register.tsx`

Form/field: Errores de validación y API.

Current behavior: La estrategia está mayormente consistente: limpia errores al iniciar submit, usa `safeParse`, muestra errores por campo y restaura loading en `finally`.

Expected behavior based on schemas: Frontend y backend deben aceptar/rechazar las mismas reglas.

Problem: La comparación directa de archivos no es válida porque frontend y backend no están ubicados en rutas relativas equivalentes; la inspección de contenido muestra espejo intencional, sin divergencia concreta confirmada en límites o nulabilidad. No se registra como issue.

Risk: No confirmado.

Suggested correction: Ninguna en P0; mantener duplicación explícita y añadir pruebas de contrato solo si una divergencia futura resulta costosa.

### FORM-05

Files: Todos los formularios revisados.

Form/field: Inputs numéricos (`totalStickers`, número de lámina, cantidad).

Current behavior: Estado permite `number | ''`; submit convierte con `Number(...)`; schemas aplican enteros positivos y límites.

Expected behavior based on schema: El backend recibe enteros positivos después de validación Zod.

Problem: No se confirmó rechazo cliente-servidor divergente. La conversión de vacío a `0` produce error local coherente; los controles de cantidad eliminan la fila al decrementar a cero.

Risk: No confirmado.

Suggested correction: Ninguna obligatoria; cubrir límites con pruebas de UI/API si se implementa una suite frontend.

## 4. Refactoring candidates

### REF-01

Files: `Login.tsx`, `Register.tsx`, `AlbumsList.tsx`, `AlbumDetail.tsx`, `CollectionsList.tsx`, `CollectionDetail.tsx`

Current pattern: Las mismas funciones locales `serverErrors`, además de la secuencia de limpiar errores → `safeParse` → mapear field errors → API → `finally`.

Proposed refactor: Extraer solo el helper puro `serverErrors` a `src/services/api.ts` o util compartido; no abstraer los submits porque cada formulario tiene payload, mutaciones y UI distintos.

Benefit: Un único mapeo de `{ fieldErrors, issues, _form }`; reduce seis copias y evita que mensajes diverjan.

Behavioral risk: LOW
Estimated scope: 2–4 archivos; mover helper y actualizar imports.
Recommended priority: P3

### REF-02

Files: `AlbumsList.tsx`, `AlbumDetail.tsx`, `CollectionDetail.tsx`

Current pattern: Loading spinners y bloques de error repetidos en páginas; estados y mensajes son locales.

Proposed refactor: Extraer únicamente componentes presentacionales pequeños si se modifica más de una vista; no crear una abstracción de estado async genérica.

Benefit: Consistencia visual y menor JSX repetido.

Behavioral risk: LOW
Estimated scope: 3–5 archivos.
Recommended priority: P4

### REF-03

Files: `Profile.tsx`, `UserProfile.tsx`, `CollectionsList.tsx`, `CollectionDetail.tsx`

Current pattern: Repetición de carga API con `loading`, `error`, `active`/cleanup y mensajes locales.

Proposed refactor: Evaluar un hook compartido solo para el patrón realmente común de carga; preservar en cada página autorización, endpoint y forma de render.

Benefit: Menos boilerplate y manejo uniforme de desmontaje/errores.

Behavioral risk: MEDIUM
Estimated scope: 4–6 archivos y una nueva utilidad/hook.
Recommended priority: P4

### REF-04

Files: `AlbumsList.tsx`, `AlbumDetail.tsx`, `CollectionDetail.tsx`

Current pattern: Cada página implementa modal, estados de formulario, campos, errores y botones de cierre por separado.

Proposed refactor: No extraer un “form modal” genérico todavía; primero corregir tipos de botón y errores. Si la UI continúa creciendo, extraer componentes de campos o modal presentacional, no lógica de dominio.

Benefit: Posible reducción de JSX, pero beneficio actual menor que riesgo de prop drilling.

Behavioral risk: MEDIUM
Estimated scope: 5–8 archivos.
Recommended priority: P5 / defer

### REF-05

Files: `app/backend/src/middlewares/upload.ts`, `app/backend/prisma/seed.ts`, `app/backend/src/app.ts`

Current pattern: Tres lugares calculan `path.join(process.cwd(), 'uploads')` o asumen `uploads` relativo.

Proposed refactor: Centralizar la ruta de uploads en una constante/configuración backend compartida, sin cambiar la ruta pública.

Benefit: Evita que seed, Multer y static serving diverjan cuando cambia el working directory.

Behavioral risk: LOW
Estimated scope: 3 archivos.
Recommended priority: P2, junto con la corrección Docker

### REF-06

Files: `CollectionsList.tsx`, `CollectionDetail.tsx`, `Profile.tsx`, `UserProfile.tsx`

Current pattern: URLs query se construyen mediante interpolación directa (`?userId=${...}`); endpoints de reportes se cargan ad hoc.

Proposed refactor: Usar `URLSearchParams` para queries y un pequeño helper de endpoint solo si se agregan más filtros.

Benefit: Menor riesgo de encoding incorrecto al ampliar filtros.

Behavioral risk: LOW
Estimated scope: 2–4 archivos.
Recommended priority: P5 / defer

## 5. Deprecated / maintenance findings

### MAINT-01

Current: `app/backend/package.json:18-20` declara:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Prisma CLI reporta que `package.json#prisma` está deprecated para Prisma 7.

Future issue: La configuración legacy puede dejar de funcionar al actualizar Prisma; el seed dejará de ser descubierto por CLI.

Suggested migration: Crear `app/backend/prisma.config.ts` con `defineConfig`, cargar `dotenv/config`, mover `seed` a `migrations.seed` y actualizar la configuración/flujo conforme a la versión objetivo. No migrado en P0.

Urgency: MEDIUM; no bloquea la versión actual, pero debe resolverse antes de actualizar a Prisma 7.

Evidence externa consultada: documentación actual de Prisma Context7 indica que la clave `prisma` en `package.json` es legacy/deprecated y que Prisma 7 usa `prisma.config.ts` con `migrations.seed`.

### MAINT-02

Current: README e informe técnico afirman que la configuración Docker funciona desde clone nuevo y describen el seed como paso operativo normal.

Future issue: En Linux con SELinux enforcing, la afirmación es falsa para el bind mount actual.

Suggested migration: Documentar o corregir la política del mount; añadir verificación de seed al smoke test de instalación.

Urgency: HIGH, ligada a ISSUE-01.

### MAINT-03

Current: El frontend no tiene tests propios; el backend no cubre HTTP routes, Multer filesystem, seed ni permisos Docker.

Future issue: Los comportamientos más frágiles detectados —filesystem de uploads, errores parciales de reportes y semántica de botones— no están protegidos por una prueba automatizada.

Suggested migration: Añadir pruebas pequeñas y observables por comportamiento: smoke de seed/write directory, error visible de reportes, y revisión DOM/UX de botones. No añadir una suite genérica por cobertura.

Urgency: MEDIUM.

## 6. Candidate implementation plan

### P1 — Hacer reproducible el seed desde Docker

- Corregir el bind mount/etiquetado y la ruta de uploads.
- Verificar en Linux con SELinux enforcing y desde source tree sin `uploads`.
- Ejecutar seed y comprobar que crea portada y stickers.

### P2 — Corregir semántica de botones y manejo de errores auxiliares

- Añadir `type="button"` a controles no-submit dentro de formularios.
- Dejar de convertir fallos de reportes en listas vacías.
- Mostrar fallo de carga del catálogo de álbumes en creación de colecciones.

### P3 — Consolidar mapeo de errores frontend

- Extraer helper puro `serverErrors`.
- Mantener submit handlers específicos y no introducir una abstracción de formulario genérica.

### P4 — Migrar configuración Prisma

- Pasar seed desde `package.json#prisma` a `prisma.config.ts` cuando la versión objetivo sea Prisma 7.
- Actualizar Docker/README solo si cambia el comando efectivo.

### P5 — Añadir cobertura de comportamientos frágiles

- Test backend o smoke aislado del seed/filesystem.
- Pruebas frontend solo para errores parciales y controles de formulario si el proyecto adopta un runner de UI; no crear infraestructura de tests por anticipado.

## 7. Recommended first change

Recomendación: P1 — corregir el bind mount de `/app/uploads` para que el seed funcione desde un clone nuevo.

Why: Es el único bloqueo HIGH confirmado del procedimiento oficial; impide los datos demo y contradice directamente README. También afecta uploads en runtime, no solo seed.

Expected files: `app/docker-compose.yml` y, si la solución elegida lo requiere, `app/backend/Dockerfile`/README. Mantener `seed.ts` sin cambios salvo que la ruta centralizada sea parte del mismo corte.

Behavioral risk: LOW/MEDIUM. El objetivo es conservar `/app/uploads` y `/uploads/...`; el riesgo principal está en compatibilidad Linux/SELinux y ownership del bind mount.

Verification: partir de source tree sin `app/backend/uploads`, levantar con `docker compose up -d --build`, comprobar los tres servicios `healthy`, ejecutar `docker compose exec backend npm run prisma:seed`, comprobar que seed termina 0 y que aparecen `mundial-2026-cover.svg` y `sticker-1.svg` en el directorio compartido; después `git status --short`.

## 8. Verification results

Commands executed:

| Command | Result |
|---|---|
| `git status --short` | PASS: salida vacía al inicio |
| `git log --oneline -10` | PASS |
| `docker compose ps` | PASS: `db`, `backend`, `frontend` healthy |
| `docker compose exec backend id` | PASS: root (`uid=0`) |
| `docker compose exec backend ls -ld /app /app/uploads` | PASS: `/app/uploads` `755 root:root` |
| `docker compose exec backend stat ... /app/uploads` | PASS: `drwxr-xr-x 755 root:root` |
| `docker inspect app-backend-1 ...` | PASS: bind `/.../app/backend/uploads` → `/app/uploads`, `rw`; no `:z`/`:Z` relabel observed |
| `getenforce` | PASS: `Enforcing` |
| `ls -Zd backend/uploads` | PASS diagnóstico: host source no existía en ese momento; no se modificó |
| `docker compose exec backend ls -Zd /app/uploads` | PASS diagnóstico: `user_home_t` |
| `docker compose exec backend touch /app/uploads/.p0-write-check` | EXPECTED FAIL: `Permission denied`; no archivo creado |
| `npm run typecheck` backend | FAIL: `tsc: orden no encontrada`; dependencias locales no instaladas |
| `npm run lint` backend | FAIL: `eslint: orden no encontrada` |
| `npm run format:check` backend | FAIL: `prettier: orden no encontrada` |
| `npm test` backend | FAIL: `vitest: orden no encontrada` |
| `npm run typecheck` frontend | FAIL: `tsc: orden no encontrada` |
| `npm run lint` frontend | FAIL: `eslint: orden no encontrada` |
| `npm run format:check` frontend | FAIL: `prettier: orden no encontrada` |
| `npm run build` frontend | FAIL: `tsc: orden no encontrada` |
| `diff` frontend/backend validation attempt | INCONCLUSIVE: rutas relativas incorrectas en el comando de inspección; no se reporta divergencia por ello |
| Context7 Prisma docs query | PASS: confirmó migración de `package.json#prisma` a `prisma.config.ts` en Prisma 7 |

No se ejecutó `docker compose up -d --build`, `npm install`, `npm run prisma:seed`, `chmod`, `chown`, migraciones ni comandos destructivos durante P0. La reproducción de escritura usó únicamente `touch` sobre un archivo temporal que falló antes de crear archivo.

## 9. Git status

Comando requerido: `git status --short`

Resultado inicial observado: salida vacía. El informe es el único archivo creado explícitamente por la solicitud de P0; no se modificaron source code, configuración, tests, Dockerfiles, dependencias ni archivos generados. El working tree de código permaneció unchanged.
