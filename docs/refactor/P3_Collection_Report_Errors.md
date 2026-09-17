# P3 — Collection Report Errors

## 1. Objective

Correct silent error handling in `CollectionDetail` for:

- `GET /collections/:id/missing`
- `GET /collections/:id/duplicates`

Report request failures must no longer become valid empty arrays. Successful empty reports must remain distinguishable from failed requests, without changing API endpoints, report calculations, visibility rules or collection business logic.

## 2. Previous behavior

`app/frontend/src/pages/CollectionDetail.tsx` loaded both reports with `Promise.all`:

```tsx
const [missing, duplicates] = await Promise.all([
  api<Sticker[]>(`/collections/${id}/missing`).catch(() => []),
  api<DuplicatedSticker[]>(`/collections/${id}/duplicates`).catch(() => []),
])
setMissingStickers(missing)
setDuplicateStickers(duplicates)
```

Any HTTP, network or server failure was converted to `[]`. The render path then treated that value exactly like a successful empty response:

```tsx
missingStickers.length === 0
 duplicateStickers.length === 0
```

Therefore failed report requests could appear as legitimate zero-result reports.

## 3. Solution

Added independent state:

```tsx
const [missingError, setMissingError] = useState<string | null>(null)
const [duplicatesError, setDuplicatesError] = useState<string | null>(null)
```

`loadAll` now uses `Promise.allSettled` for the two report requests:

- fulfilled missing response updates `missingStickers`;
- rejected missing response sets `missingError`;
- fulfilled duplicates response updates `duplicateStickers`;
- rejected duplicates response sets `duplicatesError`.

The two requests are independent. A successful report remains usable if the other report fails.

At the start of every reload, both report errors are cleared. A previous failure therefore does not remain visible after a successful reload, and a failed reload cannot silently reset report state to an empty valid result.

Rendering checks report error state before empty-state state. Empty arrays are rendered as the existing legitimate empty reports only when their corresponding request fulfilled successfully.

Error wording is user-facing and does not expose stack traces or internal server details:

- `No se pudo cargar el reporte de láminas faltantes.`
- `No se pudo cargar el reporte de láminas repetidas.`

## 4. Files changed

- `app/frontend/src/pages/CollectionDetail.tsx`: replaced `.catch(() => [])` report loading with independent `Promise.allSettled` results, report error state, reload reset and error-first rendering.
- `docs/refactor/P3_Collection_Report_Errors.md`: this report.

No backend, API contract, Prisma, Docker, Zod schema, P1 or P2 report was modified.

## 5. UX behavior

| Situation | Expected UI |
|---|---|
| Report succeeds with data | Existing report data renders normally. |
| Report succeeds empty | Existing legitimate empty state renders. |
| Missing report fails | Visible `No se pudo cargar el reporte de láminas faltantes.` message in the missing tab. |
| Duplicates report fails | Visible `No se pudo cargar el reporte de láminas repetidas.` message in the duplicates tab. |
| One succeeds / one fails | Successful report remains valid and usable; failed report is identified independently. |
| Reload begins | Previous report errors clear before new results arrive. |

## 6. Verification

| Check | Result |
|---|---|
| `npm run typecheck` from `app/frontend` | PASS |
| `npm run lint` from `app/frontend` | PASS — 0 errors; 4 pre-existing warnings |
| `npm run format:check` from `app/frontend` | PASS |
| `npm run build` from `app/frontend` | PASS |
| `git diff --check` | PASS |

Manual smoke checks performed:

- Started frontend dev server on port `4173`.
- Logged in with existing seeded credentials through the running app.
- Loaded collection `1` (`Mi Álbum del Mundial`).
- Confirmed seeded non-empty collection data rendered, including missing count `5` and duplicate count `2`.
- Confirmed both report endpoints were requested by the page.

A controlled permanent backend failure was not introduced. No claim is made that a real backend failure scenario was manually reproduced; the failure path is implemented explicitly through rejected `Promise.allSettled` results and was covered by typecheck/build plus final diff inspection.

## 7. Behavioral impact

Collection report request failures are no longer represented as valid empty reports. Existing report calculation, API contracts, collection visibility, authorization and collection business rules are unchanged.

Successful report data and legitimate empty reports retain existing behavior.

## 8. Diff summary

P3 implementation diff:

```text
 app/frontend/src/pages/CollectionDetail.tsx | 39 +++++++++++++++++++++++------
 1 file changed, 31 insertions(+), 8 deletions(-)
```

The P3 implementation changes only `CollectionDetail.tsx`. Existing P1/P2 working-tree modifications are separate and were left untouched.

## 9. Suggested commit

```text
fix(frontend): surface collection report loading errors
```

No commit was created.

## 10. Final repository state

Final `git status --short` after P3 implementation and report creation:

```text
 M app/frontend/src/pages/CollectionDetail.tsx
?? docs/refactor/P3_Collection_Report_Errors.md
```

Interpretation:

- `CollectionDetail.tsx`: P3 report error-handling implementation. No separate P1/P2 working-tree modifications were present in the final status snapshot.
- `P3_Collection_Report_Errors.md`: this P3 report.
- P1/P2 files and reports were not modified by this task.

No unrelated changes were introduced.
