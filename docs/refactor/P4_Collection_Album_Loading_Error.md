# P4 — Collection Album Loading Error

## 1. Objective

Correct silent `/albums` loading failure in `CollectionsList`.

The collection creation form requires an existing album. P4 distinguishes:

- successful album loading with data;
- successful album loading with zero albums;
- album request failure;
- album request currently loading.

The fix prevents a failed album request from appearing as an ordinary empty album list or degrading into only an `albumId` validation error.

## 2. Previous behavior

`app/frontend/src/pages/CollectionsList.tsx` used:

```tsx
const loadAlbums = async () => {
  try {
    const data = await api<Album[]>('/albums')
    setAlbums(data)
    if (data.length > 0) setSelectedAlbumId(data[0].id)
  } catch {
    // Ignore
  }
}
```

The request ran from the `useEffect` watching `user`. On rejection:

- `albums` remained its initial empty array;
- no loading state represented the request;
- no error state reached the modal;
- the modal rendered the same `No hay álbumes creados en el sistema` message used for a legitimate empty response;
- `selectedAlbumId` remained `''` unless a previous successful load had selected an album;
- the submit handler converted it with `Number(selectedAlbumId)`, producing `0`, after which `createCollectionSchema` could report an invalid `albumId`.

The API failure and a successful `[]` response were therefore not represented independently.

## 3. Root cause

`albums = []` was the only observable result after both successful-empty and failed-loading paths. The component had no album-specific loading or error state, so the modal could not explain whether no albums existed or `/albums` failed.

## 4. Solution

Added local state in `CollectionsList`:

```tsx
const [albumsLoading, setAlbumsLoading] = useState(false)
const [albumsError, setAlbumsError] = useState<string | null>(null)
```

`loadAlbums` now:

1. sets loading true;
2. clears stale album error;
3. clears the previous list and selection before requesting;
4. stores successful data and selects the first album when available;
5. preserves successful `[]` as a legitimate empty result;
6. sets `No se pudieron cargar los álbumes.` on request failure;
7. always clears loading in `finally`.

The modal renders states in this order:

- loading: `Cargando álbumes...`;
- error: explicit error plus local `Reintentar` control;
- successful empty: existing no-albums message;
- successful data: existing album selector.

The submit button is disabled while albums are loading, while album loading has an error, and when the successfully loaded list is empty. Existing `albumId` Zod validation remains unchanged.

Retry calls the same local `loadAlbums` function. It clears the previous error before requesting and restores normal selector/submission behavior after success.

## 5. Files changed

Implementation:

- `app/frontend/src/pages/CollectionsList.tsx`: explicit album loading/error state, local retry control, state-aware selector rendering and submission guard.

Documentation:

- `docs/refactor/P4_Collection_Album_Loading_Error.md`: this report.

No backend, API contract, Prisma, Docker, schema, collection business rule, P3 report handling or generic loading infrastructure changed.

## 6. UX state matrix

| State | Album selector / modal | Submission |
|---|---|---|
| Loading | `Cargando álbumes...` | Disabled |
| Success with albums | Existing selector populated; first album selected as before | Available with valid selection |
| Success empty | Existing `No hay álbumes creados en el sistema. Primero crea un álbum.` state | Disabled because collection requires an album |
| Error | `No se pudieron cargar los álbumes.` plus `Reintentar` | Disabled |
| Retry succeeds | Error clears; selector is repopulated and first album selected | Available normally |

## 7. Validation behavior

`createCollectionSchema` and positive-integer `albumId` validation were not changed.

Invalid album IDs remain rejected when form input actually contains an invalid ID. Album-loading failures are now represented by album-loading state and are blocked before the form can surface only an `albumId` validation error.

## 8. Verification

Quality gates from `app/frontend`:

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS — 0 errors; 4 pre-existing warnings |
| `npm run format:check` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

Manual smoke checks:

### TESTED

- Started frontend dev server.
- Logged in using seeded `cole1@test.com` credentials.
- Opened `/collections`.
- Opened `Nueva Colección` modal.
- Confirmed existing seeded album appeared in selector: `Mundial 2026 (10 láminas)`.
- Confirmed collection page remained functional and the submit button was enabled after album data loaded.

### CODE-INSPECTED ONLY

- Successful empty `/albums` response: render branch preserves the existing no-albums message and disables submit.
- Failed `/albums` request: catch now sets explicit album error and submit guard blocks submission.
- Loading state: submit guard includes `albumsLoading`; modal renders loading text.
- Retry: local `Reintentar` calls `loadAlbums`, clears stale error, and restores data on success.

No backend behavior was altered to manufacture an empty or failed response. No claim is made that empty-response or failed-request runtime scenarios were manually reproduced.

## 9. Behavioral impact

Album-loading failures in the collection creation flow are now represented explicitly instead of being silently treated as an empty album list. Legitimate empty responses remain distinct, and collection submission is prevented while required album data is unavailable.

Album endpoints, collection creation contract, authentication, validation, business rules and album behavior remain unchanged.

## 10. Diff summary

P4 implementation diff:

```text
 app/frontend/src/pages/CollectionsList.tsx | 30 +++++++++++++++++++++++++++---
 1 file changed, 27 insertions(+), 3 deletions(-)
```

The implementation diff contains only `CollectionsList.tsx`. This report is separate documentation and is excluded from the implementation count.

## 11. Suggested commit

```text
fix(frontend): handle album loading failures
```

No commit was created.

## 12. Final repository state

Final `git status --short`:

```text
 M app/frontend/src/pages/CollectionsList.tsx
?? docs/refactor/P4_Collection_Album_Loading_Error.md
```

Interpretation:

- `CollectionsList.tsx`: P4 implementation.
- `P4_Collection_Album_Loading_Error.md`: P4 report.
- No unrelated working-tree changes were present in the final status snapshot.
- Previous P0/P1/P2/P3 reports and implementation changes were not modified by P4.
