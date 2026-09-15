# AGENTS.md — Protocolo de agentes

## Antes de editar

- Leer AGENTS.md (este documento).
- Revisar código relacionado y patrones existentes.
- Localizar referencias afectadas.

## Al implementar

- Mantener el flujo MVC estricto.
- Validar entradas en servidor con Zod ANTES de tocar la BD.
- Colocar reglas de negocio en `services`.
- Colocar Prisma en `repositories`.
- Mantener el alcance mínimo del brief.
- No dejar stubs, mocks, no-ops ni código muerto.

## Definition of Done

- Entradas validadas con Zod.
- Tipado TypeScript correcto y estricto.
- Routes sin lógica de negocio ni Prisma.
- Services con reglas de negocio.
- Controladores responden con HTTP status codes correctos (200, 201, 400, 401, 403, 404, 500).
- Rutas protegidas con sesión (express-session).
- Autorización por propiedad implementada: un usuario solo edita/elimina sus propios álbumes, láminas y colecciones.
- Visibilidad respetada: colecciones privadas solo visibles para su dueño; públicas para todos.
- Interfaz renderiza condicionalmente según autoría y visibilidad (`isPublic`).
- Typecheck, lint y pruebas relevantes pasan.

## Prohibiciones

No:

- romper MVC;
- acceder a Prisma desde routes, controllers o React;
- omitir validación Zod;
- guardar contraseñas sin hash (usar bcryptjs);
- permitir a un usuario editar/eliminar álbumes, láminas o colecciones ajenas, ni ver colecciones privadas de otros;
- usar JSON Web Tokens (JWT) (se exige express-session);
- agregar dependencias sin necesidad;
- dejar implementaciones falsas o incompletas.
