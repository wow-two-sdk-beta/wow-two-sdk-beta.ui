# SDK Migration — `@wow-two-beta/ui` (Temporal dates + `/http` slice)

*Last updated: 2026-07-03*

> Handoff: migrate a frontend consumer onto the updated `@wow-two-beta/ui` + the new model/type conventions.
> **Order:** `smart-qr` first (current task), then `drydock` · `secrets-vault` · `sift`. Each is one focused session.

---

## What changed (this workstream)

**`@wow-two-beta/ui` (done, verified — lib build + showcase build green; NOT yet pushed):**
- All date/time components are **Temporal** (`@js-temporal/polyfill`): `DatePicker`/`DateField`/`Calendar` → `Temporal.PlainDate`; `DateRangePicker`/`RangeCalendar` → `{ start, end: PlainDate }`; `TimeField`/`TimePicker` → `Temporal.PlainTime` (`TimeValue` removed); `EventCalendar`/`ScheduleView` → `Temporal.ZonedDateTime`; `Gantt`/`HeatmapCalendar` → `PlainDate`; `DataTable` sort supports Temporal.
- New **`@wow-two-beta/ui/http`** slice (`src/http/`): `ApiResponse<T>` (`{ data }`), `ProblemDetails` (RFC-7807), `ApiError` (`status` + `problem`), `IsoDate`/`IsoDateTime` branded strings, and `temporalReviver` + `parseJson<T>(text)` (the global inbound date wiring; outbound is automatic via `Temporal.*.toJSON()`).

**Conventions written in `wow-two-ws/conventions/development/`:**
- frontend `code-style/{models,type-mapping,enums}.md` · `presentation/forms.md` · backend `presentation/serialization.md`.

---

## Prerequisite

- **Push `@wow-two-beta/ui` → CI publishes + bumps `0.0.y`.** Consumers pin the *published* version, so no migration can run until this lands. Migration step 1 is always "bump to that version".

---

## Per-consumer checklist

1. bump `@wow-two-beta/ui` to the published version carrying the above.
2. **envelope + errors** — delete the product's own `ApiResponse`/`ApiSuccess`/`ProblemDetails`/`ApiError`; import them from `@wow-two-beta/ui/http`.
3. **date wiring** — parse every response in the client via `parseJson(text)` (or `JSON.parse(text, temporalReviver)`) so wire dates become `Temporal.*`; drop hand-rolled `new Date(iso)` formatters (format `Temporal.*` at the view).
4. **date components** — swap any native date input / old `Date`-typed usage for the Temporal-typed SDK components; bridge form `*Values` ↔ `Temporal.*` on submit ([forms.md](../../conventions/development/frontend/presentation/forms.md)).
5. **models** — apply [models.md](../../conventions/development/frontend/code-style/models.md) + [type-mapping.md](../../conventions/development/frontend/code-style/type-mapping.md): bare domain model + `*Dto` (only on shape mismatch) + `map{Entity}`; fields `T` / `T?` (no `| null`); `ReadonlyArray<T>` (never `T[]`); dates `Temporal.*`.
6. **enums** — [enums.md](../../conventions/development/frontend/code-style/enums.md): const object, **PascalCase key / camelCase value** + `{Enum}Labels`. Backend must emit camelCase enum JSON ([serialization.md](../../conventions/development/backend/presentation/serialization.md)) → then the wire value = the const value and any case-normalizing read helper is deleted.
7. **verify** — FE `pnpm typecheck` + `pnpm test`; backend build + all suites.

---

## Targets

| Product | FE model file | Key deltas |
|---|---|---|
| **smart-qr** (first) | `src/types/index.ts` + `src/types/content/*` | see below |
| drydock | `src/api/types.ts` | positional-record backend DTOs; `ApiResponse<T>` here; flagship |
| secrets-vault | `src/api/types.ts` | mirrors drydock |
| sift | `src/lib/types.ts` | `readonly`-heavy; bare-named wire models |

### smart-qr specifics (the current task)
- **Envelope:** it uses `ApiSuccess<T>` (`src/types/index.ts`) → replace with `ApiResponse<T>` from `@wow-two-beta/ui/http`; add `ProblemDetails`/`ApiError` from there (currently ad-hoc).
- **Enums:** const-objects with **PascalCase values** (`BarcodeFormat = { QrCode: "QrCode" }`) + an `enumFromWire()` case-insensitive read helper in `CreateCodeScreen.tsx`. Migrate values → camelCase (`"qrCode"`), switch the **backend** `JsonStringEnumConverter` → `JsonNamingPolicy.CamelCase`, then delete `enumFromWire` (identity mapping).
- **Dates:** `CodeDto.createdAt` is `string`; the `calendar` content uses a native `<input datetime-local>` (`DateTimeField` in `components/content/fields.tsx`) — NOT the SDK date components. Adopt `parseJson`/reviver so `createdAt` → `Temporal.Instant`; optionally swap `DateTimeField` for the SDK `DateField`+`TimeField` (Temporal). Content date fields (`calendar.start/end`) stay wire strings inside `CodeContent` (the backend encodes iCalendar) — do NOT force Temporal there.
- **Models:** `CodeDto` (+ `content/*Content`) → apply the bare-model / `*Dto` + mapper rules; the polymorphic `CodeContent` union already conforms (discriminated on `type`).
- **Backend:** flip enum serialization to camelCase; re-run all suites (Unit/Integration/E2E/Migrations) — the E2E asserts wire enum casing (`"Wifi"` → `"wifi"`, `"MobileApp"` → `"mobileApp"`, `"Ios"`/`"Android"` device values) so those assertions change too.

---

## Current state

- `@wow-two-beta/ui` Temporal + `/http` = **done, verified, uncommitted-pending-push** (the human pushes; CI publishes).
- Conventions = written, review-ready (may iterate).
- **No consumer migrated yet** — all wait on the publish. Start with smart-qr.
- Not in scope here: smart-qr's own feature work (version-track) continues separately.
