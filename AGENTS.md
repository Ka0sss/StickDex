# AGENTS.md — Protocolo de agentes

## Modos operativos activos

- **Caveman (ultra)**: comunicación terse en toda respuesta. Prosa comprimida, sin filler ni artículos; fragmentos OK. Términos técnicos, código, errores, comandos y tipos de commit se mantienen verbatim. No aplica a código, commits ni docs (se escriben normales). Apagar: "stop caveman" / "normal mode".
- **Ponytail (lite)**: construir lo pedido, y nombrar la alternativa más simple en una línea para que el usuario decida. Sin imponer minimalismo extremo. No simplificar jamás: validación en fronteras de confianza, manejo de errores que evita pérdida de datos, seguridad, accesibilidad, y lo pedido explícito. Apagar: "stop ponytail" / "normal mode".

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

## Disciplina de alcance

- Implementar SOLO lo solicitado. Nada de "mejorar de paso" (YAGNI).
- No renombrar, reformatear ni refactorizar código no relacionado con la tarea.
- No eliminar ni modificar código, comentarios o config que no se pidió.
- No agregar dependencias, archivos ni configs no solicitadas.
- Un cambio = un commit = una sola preocupación.
- Ante ambigüedad: seguir las convenciones existentes; si hay dos opciones válidas, elegir la más conservadora y declararla.
- No introducir una segunda convención junto a una existente.

## Antes de pushear / entregar

- NO pushear sin confirmación explícita del usuario.
- NO forzar push (`--force`) ni reescribir historia de ramas compartidas.
- Ejecutar typecheck, lint y pruebas relevantes ANTES de pushear.
- Suite disponible: `app/backend` con `npm test` (Vitest, sin base de datos). El frontend no tiene suite propia; su comportamiento se verifica con el smoke test de la app real.
- Verificar el comportamiento con smoke test (correr la app real, no solo los tests).
- Confirmar que no se rompieron pruebas existentes.
- Commit atómico con mensaje Conventional Commits.
- No pushear trabajo a medias, stubs ni código no verificado.

## Verificación y honestidad

- Reportar exactamente qué se verificó y cómo; no afirmar resultados no comprobados.
- Correr la suite completa si el cambio es transversal.
- Preguntar antes de comandos destructivos (drop de BD, migración destructiva, borrado de archivos).
- Si algo bloquea, reportar el bloqueo real y lo ya intentado; no inventar.

## Definition of Done

- Entradas validadas con Zod.
- Tipado TypeScript correcto y estricto.
- Routes sin lógica de negocio ni Prisma.
- Services con reglas de negocio.
- Controladores responden con HTTP status codes correctos (200, 201, 400, 401, 403, 404, 409, 500).
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
- dejar implementaciones falsas o incompletas;
- pushear sin confirmación explícita del usuario.
