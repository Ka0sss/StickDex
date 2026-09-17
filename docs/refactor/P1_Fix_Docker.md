# P1 — Fix Docker uploads permissions and restore fresh-clone seed

Fecha: 2026-09-17

## 1. Root cause confirmed

`app/docker-compose.yml` bind-mountaba `./backend/uploads` en `/app/uploads` sin opción SELinux.

En el host auditado:

- SELinux estaba `Enforcing`.
- El contenedor backend corría como `root`.
- El directorio montado tenía permisos POSIX `755 root:root`.
- El contexto SELinux era `user_home_t`.
- Escribir dentro del contenedor fallaba con `Permission denied` pese a ser root.
- El `RUN mkdir -p uploads` del Dockerfile no resolvía el problema: Compose reemplaza ese directorio con el bind mount al arrancar.
- El seed escribe `/app/uploads/mundial-2026-cover.svg` y los stickers mediante `fs.writeFileSync`.
- Multer usa el mismo directorio calculado como `path.join(process.cwd(), 'uploads')`; static serving también expone ese path como `/uploads`.

Causa raíz: bind mount sin relabel SELinux. No era un problema de seed, usuario de proceso ni permisos POSIX.

## 2. Solution selected

Changed mount:

```yaml
- ./backend/uploads:/app/uploads:z
```

`:z` solicita a Docker relabel compartido del directorio bind-mounted para que contenedores puedan acceder bajo SELinux. Mantiene:

- Host: `app/backend/uploads`
- Container: `/app/uploads`
- Public path: `/uploads/...`
- Seed implementation
- Multer implementation
- Static serving
- API contracts

Why selected:

- Declarative Compose fix.
- Smallest possible diff: one character-level option on existing mount.
- Works with SELinux enforcing.
- Harmless on hosts where SELinux is disabled or absent; Compose accepts the option and regular bind behavior remains.
- Applies equally to seed writes and runtime Multer uploads.

Rejected:

- `chmod 777`: weakens filesystem security and does not address SELinux labeling.
- `chown`/manual commands: not fresh-clone declarative setup.
- Privileged container or disabling SELinux: unnecessary security regression.
- Application-level workarounds: duplicate Docker concern and risk divergence between seed/runtime uploads.
- Path centralization: separate P0 refactoring candidate, explicitly out of scope.

## 3. Files changed

- `app/docker-compose.yml`: added `:z` to the backend uploads bind mount.
- `docs/refactor/P1_Fix_Docker.md`: this requested final report.

No changes to seed, Multer, Express static serving, backend architecture, frontend, Prisma schema, dependencies, or README.

## 4. Fresh-clone-equivalent verification

Before implementation, `app/backend/uploads` contained no user-created files; host path was absent. No unknown data was deleted.

| Check | Result |
|---|---|
| Docker build | PASS — `docker compose up -d --build` rebuilt backend/frontend successfully |
| Docker services healthy | PASS — `db`, `backend`, `frontend` all `(healthy)` |
| Seed first execution | PASS — exit code 0; created demo users, album, 10 stickers, collection |
| Seed second execution | PASS — exit code 0; updated existing demo data and reset collection state |
| Seed images persisted | PASS — host contains `app/backend/uploads/mundial-2026-cover.svg` and `sticker-1.svg` |
| Container image files | PASS — both files visible under `/app/uploads` |
| Mount label | PASS — `/app/uploads` reports `system_u:object_r:container_file_t:s0`; inspect reports `Mode: rw,z` |
| Backend health | PASS — `{"status":"ok","database":"up"}` from `http://localhost:3000/health` |
| Frontend health | PASS — `ok` from `http://localhost:5173/healthz` |
| Static seed image access | PASS — `GET /uploads/mundial-2026-cover.svg` returned non-empty file |
| Runtime Multer upload | PASS — authenticated PNG upload returned `201` and file appeared in host bind directory; temporary file removed afterward |
| MySQL health | PASS — Compose reported db healthy |

The runtime upload smoke test used the existing login and `/api/upload` implementation. No upload implementation was added or changed.

## 5. Quality gates

Dependencies installed with locked versions:

```text
cd app/backend
npm ci
```

Result: PASS. npm emitted existing warnings for deprecated Multer 1.x and Prisma `package.json#prisma`; no dependency updates were performed.

| Command | Result |
|---|---|
| `npm run typecheck` in `app/backend` | PASS |
| `npm run lint` in `app/backend` | PASS |
| `npm run format:check` in `app/backend` | PASS — all files use Prettier style |
| `npm test` in `app/backend` | PASS — 8 files, 120 tests |
| `npm ci` | PASS using existing lockfile |

Frontend files were unchanged; frontend gates were not rerun.

## 6. Behavioral impact

No intentional application behavior changes.

Docker now relabels the existing uploads bind mount, allowing the current seed and upload implementations to write to `/app/uploads`. Existing upload URLs, static paths, API routes, and database behavior remain unchanged.

## 7. Diff summary

`git diff --stat` after implementation:

```text
 app/docker-compose.yml | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

The one-line effective change is the addition of `:z` to the bind mount. The report is untracked because it was explicitly requested by the user and is not part of the implementation diff.

## 8. Suggested commit

```text
fix(docker): allow writes to uploads bind mount
```

Commit was not executed.

## 9. Final repository state

Final `git status --short`:

```text
 M app/docker-compose.yml
?? docs/refactor/
```

`docs/refactor/` contains the previously requested P0 report and this P1 report. No unrelated source/configuration changes were introduced.
