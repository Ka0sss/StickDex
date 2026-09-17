# P5 — Server Error Helper Refactor

## 1. Objective

Remove confirmed duplication in frontend server-validation-error mapping.

Six pages contained equivalent local `serverErrors` functions. P5 extracted one pure shared helper beside the existing API error utilities and changed affected call sites to use it. Submit handlers, form architecture and user-visible error behavior remain unchanged.

## 2. Previous duplication

| File | Previous local helper | Behavior | Equivalent |
|---|---|---|---|
| `app/frontend/src/pages/Login.tsx` | `serverErrors` | Converts API field/form errors; uses fallback for general errors. | Yes |
| `app/frontend/src/pages/Register.tsx` | `serverErrors` | Same `_form`, field and fallback handling. | Yes |
| `app/frontend/src/pages/AlbumsList.tsx` | `serverErrors` | Same transformation and return shape. | Yes |
| `app/frontend/src/pages/AlbumDetail.tsx` | `serverErrors` | Same transformation and return shape; bulk issue mapping is separate and was not changed. | Yes |
| `app/frontend/src/pages/CollectionsList.tsx` | `serverErrors` | Same transformation and return shape. | Yes |
| `app/frontend/src/pages/CollectionDetail.tsx` | `serverErrors` | Same transformation and return shape for add/rename forms. | Yes |

Each helper accepted `(err: unknown, fallback: string)` and returned:

```ts
{ fields: Record<string, string>; form: string | null }
```

Each implementation:

1. called `getFieldErrors(err)`;
2. separated `_form` from field errors;
3. returned `_form` as the general form error when present;
4. returned field errors without a general error when fields existed;
5. otherwise used `err.message` for `Error` instances or the supplied fallback.

## 3. Existing API error architecture

`app/frontend/src/services/api.ts` already owns API error parsing:

- `ApiError` models HTTP status, code and backend details.
- `isApiError` identifies API errors.
- `getIssues` returns structured issue entries.
- `getFieldErrors` converts backend `fieldErrors` or the first issue into `Record<string, string>`, using `_form` for an issue without a path.

P5 added `getServerErrors` to the same module. It composes `getFieldErrors` rather than parsing API details again. This is the natural boundary because the helper is API-error translation, has no React dependency, and is already consumed by form catch blocks.

## 4. Shared helper

Location: `app/frontend/src/services/api.ts`

Name: `getServerErrors`

Input:

```ts
(err: unknown, fallback: string)
```

Output:

```ts
{ fields: Record<string, string>; form: string | null }
```

Fallback semantics preserved exactly:

- `_form` becomes `form` and is removed from `fields`;
- non-empty field errors return with `form: null`;
- an `Error` message is used when no field/form error exists;
- the supplied fallback is used for non-`Error` values.

The helper is pure: no state, React, network calls or side effects. Abstraction stops at error transformation; submit handlers remain local and form-specific.

## 5. Files changed

### Implementation

- `app/frontend/src/services/api.ts`: added shared `getServerErrors` mapper.
- `app/frontend/src/pages/Login.tsx`: removed local mapper and updated import/call.
- `app/frontend/src/pages/Register.tsx`: removed local mapper and updated import/call.
- `app/frontend/src/pages/AlbumsList.tsx`: removed local mapper and updated import/call.
- `app/frontend/src/pages/AlbumDetail.tsx`: removed local mapper and updated import/call; retained separate bulk issue handling.
- `app/frontend/src/pages/CollectionsList.tsx`: removed local mapper and updated import/call.
- `app/frontend/src/pages/CollectionDetail.tsx`: removed local mapper and updated both add/rename calls.

### Documentation

- `docs/refactor/P5_Server_Error_Helper_Refactor.md`: this report.

No backend, API contract, schema, Docker, Prisma, dependency or previous report changed.

## 6. Behavior preservation

| Behavior | Result |
|---|---|
| Client validation | Unchanged |
| Server field errors | Unchanged |
| General server errors | Unchanged |
| Successful submit | Unchanged |
| API requests | Unchanged |
| Form state architecture | Unchanged |

Only helper ownership and imports changed. Fallback strings at every call site remain unchanged.

## 7. Verification

| Check | Result |
|---|---|
| `npm run typecheck` from `app/frontend` | PASS |
| `npm run lint` from `app/frontend` | PASS — 0 errors; 4 pre-existing warnings |
| `npm run format:check` from `app/frontend` | PASS |
| `npm run build` from `app/frontend` | PASS |
| `git diff --check` | PASS |

### TESTED

- Started frontend dev server.
- Opened login form in browser.
- Submitted invalid email and empty password.
- Confirmed existing client validation remained visible: `Email inválido` and `La contraseña es obligatoria`.

### CODE-INSPECTED ONLY

- Shared helper preserves all six previous implementations line-for-line in behavior.
- Server field-error and general-error call sites now use the shared helper.
- A server validation failure was not manufactured; no backend behavior was changed solely for P5.
- Successful submit behavior was not changed by the refactor and was covered by typecheck/build rather than a new persistent test.

No frontend test framework was introduced; repository has no established frontend test suite suitable for this pure helper.

## 8. Refactor impact

- Duplicated helper implementations removed: 6.
- Shared helper introduced: 1 (`getServerErrors` in `services/api.ts`).
- Implementation diff: 22 insertions, 79 deletions; net reduction of 57 lines.
- User-visible behavior: unchanged intentionally.
- Surrounding submit handlers: not generalized or refactored.

Conclusion: P5 reduces duplicated frontend error-mapping logic without intentionally changing validation, submission or API behavior.

## 9. Deferred opportunities

P5 intentionally does not implement:

- `REF-02` — shared loading/error presentation;
- `REF-03` — generic async loading hooks;
- `REF-04` — generic modal abstraction;
- `REF-05` — backend uploads path centralization;
- `REF-06` — query URL construction cleanup;
- `MAINT-01` — Prisma configuration migration;
- `MAINT-03` — broader frontend/integration test coverage;
- Multer dependency upgrade.

These remain backlog items, not unfinished P5 work.

## 10. Diff summary

Implementation diff:

```text
 app/frontend/src/pages/AlbumDetail.tsx      | 15 ++-------------
 app/frontend/src/pages/AlbumsList.tsx       | 15 ++-------------
 app/frontend/src/pages/CollectionDetail.tsx | 17 +++--------------
 app/frontend/src/pages/CollectionsList.tsx  | 15 ++-------------
 app/frontend/src/pages/Login.tsx            | 15 ++-------------
 app/frontend/src/pages/Register.tsx         | 15 ++-------------
 app/frontend/src/services/api.ts            |  9 +++++++++
 7 files changed, 22 insertions(+), 79 deletions(-)
```

The P5 report is separate documentation and excluded from the implementation count.

## 11. Suggested commit

```text
refactor(frontend): centralize server error mapping
```

No commit was created.

## 12. Final repository state

Final `git status --short` after implementation and report creation:

```text
 M app/frontend/src/pages/AlbumDetail.tsx
 M app/frontend/src/pages/AlbumsList.tsx
 M app/frontend/src/pages/CollectionDetail.tsx
 M app/frontend/src/pages/CollectionsList.tsx
 M app/frontend/src/pages/Login.tsx
 M app/frontend/src/pages/Register.tsx
 M app/frontend/src/services/api.ts
?? docs/refactor/P5_Server_Error_Helper_Refactor.md
```

Interpretation:

- Seven listed frontend files: P5 implementation.
- `P5_Server_Error_Helper_Refactor.md`: P5 report.
- No unrelated working-tree changes were present in the final status snapshot.
- P0–P4 reports were not modified by P5.
