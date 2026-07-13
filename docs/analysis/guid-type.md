# Guid — frontend type for the SDK

*Last updated: 2026-07-11*

A branded-string `Guid` for `@wow-two-beta/ui` that mirrors the backend `System.Guid` 1:1 — same wire shape, plus `.NET 9`-style static creation including **UUIDv7** (`Guid.createV7()` ↔ `Guid.CreateVersion7()`) for client-generated, time-ordered ids that pair with optimistic inserts. This analysis fixes the representation, the API, where it lives, and whether to pull a library.

---

## 1. `.NET 9` `System.Guid` — verified surface

Verified against the authoritative Microsoft Learn `Guid` Struct + `Guid.CreateVersion7` pages (monikers `net-9.0` / `net-10.0` / `net-11.0`), not recalled.

| Member | Shape | Notes |
|---|---|---|
| `Guid.NewGuid()` | `static Guid` | Random **v4** (RFC 9562 §4.4), 122 bits CSPRNG entropy. The canonical v4 factory. |
| `Guid.CreateVersion7()` | `static Guid` | **v7**, added in `.NET 9`. Uses `DateTimeOffset.UtcNow` for the 48-bit ms timestamp; seeds `rand_a` + `rand_b` with random data. |
| `Guid.CreateVersion7(DateTimeOffset)` | `static Guid` | v7 with a caller-supplied timestamp; throws `ArgumentOutOfRangeException` if before the Unix epoch. |
| `Guid.Empty` | `static readonly Guid` | The nil UUID — all zeros (`00000000-0000-0000-0000-000000000000`). |
| `Guid.Parse` / `TryParse` | `static Guid` / `bool` | Accepts `N`/`D`/`B`/`P`/`X` formats; **does not** validate version/variant bits — any hex in a legal shape parses. |
| `Guid.Version` / `Variant` | instance props | Read the version nibble / variant bits out of an existing value. |
| `CompareTo` / `IComparable` + `op_<,>` | ordering | Lexical-ish ordering; for v7 values this **is** creation-time order. |
| `Equals` / `op_Equality` | equality | Value equality, case-insensitive on the hex. |
| `ToString("D")` (default) | `string` | 36-char lowercase hyphenated. |
| `ToByteArray(bool bigEndian)` · `new Guid(span, bool bigEndian)` | bytes | `.NET 9` endianness-aware byte I/O — see the endianness note below. |

### Correction — there is **no** `Guid.CreateVersion4()`

The brief listed `Guid.CreateVersion4()` as part of the `.NET 9` surface. **It does not exist.** The `Guid` Struct methods table (net-9.0 → net-11.0) lists only `CreateVersion7()` and `CreateVersion7(DateTimeOffset)` among the RFC-9562 factories; **v4 remains `Guid.NewGuid()`**. `CreateVersion4` was floated in preview discussion but never shipped. Consequence for us: the frontend `Guid.createV4()` parallels **`Guid.NewGuid()`**, not a same-named .NET method.

### UUIDv7 layout (RFC 9562 §5.7) — 128 bits, big-endian

```
byte:  0    1    2    3    4    5     6         7     8        9 .. 15
      └──────── unix_ts_ms (48) ───────┘  ver(4)│rand_a(12)  var(2)│──── rand_b (62) ────┘
                                          =0111              =10
```

- **48-bit** Unix-ms timestamp in the **most-significant** bits → lexical sort of the string == chronological sort.
- **4-bit** version = `0111` (7) → the 13th hex char of the D-string is always `7`.
- **12-bit** `rand_a`, **2-bit** variant = `10` (17th hex char ∈ `8 9 a b`), **62-bit** `rand_b`. 74 random bits total.
- **Not monotonic within one millisecond** in the base spec — and `.NET`'s `CreateVersion7` deliberately leaves it non-monotonic (pure random `rand_a`/`rand_b`). A per-ms counter (RFC "method 1") is optional; the `uuidv7` npm package adds one, `.NET` does not.

### Endianness — why it does not bite a string-repr frontend

RFC canonical byte order is big-endian for every field. `.NET` internally stores the first three fields (`Data1`/`Data2`/`Data3`) machine-**little-endian**, so the no-arg `ToByteArray()` emits those bytes reversed vs the string; `.NET 9`'s `ToByteArray(bigEndian: true)` / `new Guid(span, bigEndian: true)` produce/consume canonical order. **This only matters if raw Guid bytes ever cross the wire** (e.g. base64-packed) — both ends must then agree on `bigEndian`. Our frontend touches the **string form only** (JSON is always the D-string), and our own `createV7` writes bytes in RFC big-endian order before formatting, so we are canonical by construction and never exposed to the little-endian quirk.

### JSON serialization

`System.Text.Json` serializes a `Guid` as the **36-char lowercase hyphenated `D` string** (e.g. `"0197c8f4-3e2a-7c1d-8f9a-1b2c3d4e5f60"`) and deserializes `N`/`D`/`B`/`P`. So the wire value the frontend receives is exactly a lowercase `D`-string — our brand and validation regex assume precisely that.

---

## 2. Representation — branded string (not a class)

**Decision: `type Guid = string & { readonly __brand: 'Guid' }`.** Statics ride a same-named `const Guid = { … }` (TS type/value merge → `Guid` is both the type and its factory namespace, exactly like the .NET struct name).

```typescript
/** Defines a branded alias for a raw RFC-9562 GUID string (`0197…-7c1d-8f9a-…`) — wire-identical to a .NET `System.Guid`. */
export type Guid = string & { readonly __brand: 'Guid' };
```

| | Branded string ✅ | Class `Guid` |
|---|---|---|
| Runtime shape | the JSON string itself — zero wrapper | heap object per id |
| Wire mapping | **none** — DTO `id: Guid` *is* the inbound string | `toJSON`/reviver + a mapper on **every** id-bearing DTO |
| React key / URL param / map key | direct (`key={row.id}`) | must `.toString()` everywhere |
| Equality | `a === b` (or `Guid.equals` for case-folding) | `.equals()` only |
| Allocation | none | one per id, per render |
| Safety | compile-time provenance (cast-through possible) | runtime-enforced invariant |
| Precedent in this SDK | matches `IsoDateTime` / `IsoDate` in `foundation/http/DateBrands.ts` | none |

**Why branded string wins decisively:** the SDK's data doctrine is *wire shape == app shape; a mapper only reshapes, never parses* ([models.md](../../../../conventions/development/frontend/code-style/models.md) §5, [type-mapping.md](../../../../conventions/development/frontend/code-style/type-mapping.md)). A class id would force a `*Dto` mapper onto every entity that carries an id — the exact per-field mapping the design eliminates. A brand keeps ids in the **no-mapping** lane while adding compile-time "this string is an id, not free text." It is the same call already made for dates-as-brands, so it needs no new mental model.

**Refines, doesn't break, `type-mapping.md`.** That table says `Guid → string → string, "ids are plain strings."` The brand is still a `string` at runtime — it is an **opt-in tightening** of that row, not a contradiction. A field may stay `id: string` or upgrade to `id: Guid`; both serialize identically.

**Do _not_ add Guid to `temporalReviver`.** Dates get upgraded at the HTTP boundary because they need a runtime `Temporal.*` object. A Guid needs **no** runtime upgrade — it is already a string of the right shape — and no reviver can reliably tell an id string from any other 36-char string by intent. So a DTO simply types the field `id: Guid`; the inbound value flows through untouched (a boundary `as Guid` / typed-DTO assertion brands it). No reviver entry, no mapper — the "no per-field mapping" guarantee holds.

---

## 3. API — match .NET's static feel

```typescript
export const Guid = {
  createV7, createV4, empty, parse, tryParse, isGuid, equals, compare, version, toString,
} as const;
```

| Member | Signature | Semantics | .NET parallel |
|---|---|---|---|
| `Guid` (type) | `string & { readonly __brand: 'Guid' }` | Branded wire string; runtime = a plain `string`. | `System.Guid` (struct) |
| `createV7` | `(timestamp?: number \| Temporal.Instant) => Guid` | **Default factory.** Time-ordered v7; `timestamp` defaults to now. Non-monotonic within a ms (matches .NET). | `Guid.CreateVersion7()` / `(DateTimeOffset)` |
| `createV4` | `() => Guid` | Random v4, `crypto.getRandomValues`. | `Guid.NewGuid()` *(not `CreateVersion4` — see §1)* |
| `empty` | `Guid` (const) | The nil UUID `00000000-…-000000000000`. | `Guid.Empty` |
| `parse` | `(s: string) => Guid` | Validate + brand; **throws** on a non-GUID string. | `Guid.Parse` |
| `tryParse` | `(s: string) => Guid \| undefined` | Validate + brand; `undefined` on failure. | `Guid.TryParse` |
| `isGuid` | `(s: string) => s is Guid` | Type-guard predicate; narrows a `string` to `Guid`. | ≈ `TryParse` (bool) |
| `equals` | `(a: Guid, b: Guid) => boolean` | Case-insensitive value equality. | `Guid.Equals` / `op_Equality` |
| `compare` | `(a: Guid, b: Guid) => number` | Lexical compare of the lowercased string; for v7 == creation order. | `Guid.CompareTo` / `IComparable` |
| `version` | `(s: string) => number \| undefined` | Reads the version nibble (7, 4, …); `undefined` if not a GUID. | `Guid.Version` |
| `toString` | `(g: Guid) => string` | Identity — a Guid already *is* its `D`-string. Kept for .NET symmetry; trivial. | `Guid.ToString("D")` |

Notes:
- **Validation is permissive** (any-version D-string), mirroring `Guid.Parse` — which ignores version/variant bits. `uuid.validate` is RFC-strict (checks the variant); we intentionally match .NET, not the stricter validator, so a v1/v4/v7 all parse.
- `createV7` accepting a `Temporal.Instant` mirrors `CreateVersion7(DateTimeOffset)` and keeps the SDK's Temporal-first date stance.
- `toString` is a near-noop; expose it only so `Guid.toString(g)` reads symmetrically beside the other statics — most call sites use the value directly.

---

## 4. Location + naming

**`src/foundation/identifiers/Guid.ts`**, barrel `index.ts`, subpath **`@wow-two-beta/ui/foundation/identifiers`**.

- **New foundation sibling `identifiers/`**, alongside `http` / `storage` / `resilience`. A concept-noun folder (matching those siblings) leaves room for future branded ids (`Slug`, `ShortId`) without a rename — cleaner than a single-type `foundation/guid/`.
- Not in `foundation/http/` next to `DateBrands`: id **creation** (`createV7`) is not an HTTP concern — it drives optimistic inserts + React keys independent of any request. The brand is wire-adjacent but the factory is not.
- **File `Guid.ts`** (PascalCase = primary export), per [naming.md](../../../../conventions/development/frontend/code-style/naming.md). The type + the `const Guid` statics live in one file (a cohesive family — [models.md](../../../../conventions/development/frontend/code-style/models.md) §2), barrel re-exports both.

```
src/foundation/identifiers/
├── Guid.ts          ← type Guid + const Guid (statics) + internal helpers
├── Guid.test.ts     ← pure-logic unit tests (v7 layout, parse, compare ordering)
└── index.ts         ← export * from './Guid'
```

Wiring (three edits, mirrors every existing foundation subpath):
1. `src/foundation/identifiers/index.ts` — barrel.
2. `tsup.config.ts` — add `identifiers: 'foundation'` to the `subpathLayer` record (drives the entry + layer tag).
3. `package.json` `exports` — add the `./foundation/identifiers` → `dist/foundation/identifiers/*` block.

---

## 5. Lib vs own — verdict: **own tiny impl**

| Option | Size / deps | Fit |
|---|---|---|
| **Own** (~25 LOC over `crypto.getRandomValues`) | 0 deps, ~0 bundle | Exact control of brand + `D`-lowercase output; matches .NET's non-monotonic v7 semantics precisely. |
| `uuid` (v12, ESM-only) | small, tree-shakeable `v7`/`v4`/`validate`/`version`/`NIL` | Would still need our brand + static wrapper; adds a dep + RFC-strict `validate` (diverges from .NET's permissive parse). |
| `uuidv7` (LiosK) | 0 deps, Apache-2.0 | Adds a 42-bit **intra-ms monotonic counter** + clock-rollback guard — *stronger* than .NET, unnecessary for temp ids / keys. |

**Verdict — own implementation.** Reasons:
1. **Tiny.** v7 is a timestamp write + version/variant nibbles + hex format — ~25 lines. Every dependency an SDK takes becomes a transitive dep for **all** consumers; not worth it for 25 lines.
2. **Closest to .NET.** Our per-ms-random (non-monotonic) v7 matches `Guid.CreateVersion7`'s documented behavior exactly. `uuidv7`'s monotonic counter would make the frontend *diverge* from the backend factory.
3. **Robust in non-secure contexts.** Built on `crypto.getRandomValues` (works on plain-HTTP LAN, insecure origins) — unlike `crypto.randomUUID`, which is **v4-only and secure-context-only** (throws on `http://` non-localhost). We also can't use `randomUUID` for v7 at all.
4. **We wrap regardless.** The value we ship is the brand + static surface (`parse`/`tryParse`/`isGuid`/`equals`/`compare`); a lib only supplies `v7()`/`v4()`/`validate()`, which we'd re-wrap anyway.
5. **Trivial escape hatch.** If strict intra-ms monotonicity ever becomes a real requirement, swapping the internals to `uuidv7` behind the same `Guid.createV7` is a one-file change — the public brand + API don't move.

Core of the own `createV7` (illustrative):

```typescript
const HYPHEN_D = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createV7(timestamp?: number | Temporal.Instant): Guid {
  const ms = timestamp === undefined
    ? Date.now()
    : typeof timestamp === 'number' ? timestamp : timestamp.epochMilliseconds;

  const b = new Uint8Array(16);
  crypto.getRandomValues(b);                 // 74 random bits (rest overwritten below)

  b[0] = (ms / 2 ** 40) & 0xff;              // 48-bit big-endian unix_ts_ms
  b[1] = (ms / 2 ** 32) & 0xff;
  b[2] = (ms / 2 ** 24) & 0xff;
  b[3] = (ms / 2 ** 16) & 0xff;
  b[4] = (ms / 2 ** 8) & 0xff;
  b[5] = ms & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;               // version 7
  b[8] = (b[8] & 0x3f) | 0x80;               // variant 0b10

  return format(b) as Guid;                  // 16 bytes → lowercase hyphenated D-string
}
```

`createV4` is the same minus the timestamp writes (fill all 16 random, set version `0x40` + variant); `empty`/`parse`/`tryParse`/`isGuid` are thin work over `HYPHEN_D`.

---

## 6. Optimistic-insert usage sketch

The real reason a **client-generated** v7 id matters — it lets an optimistic row carry its *final* id before the server round-trips, so the React key is stable across the optimistic → confirmed swap and the row lands in the correct sort slot immediately.

```typescript
import { Guid } from '@wow-two-beta/ui/foundation/identifiers';
import { useOptimisticMutation } from '@wow-two-beta/ui/query';

function useCreateCode() {
  return useOptimisticMutation<CodeDto, CreateUpdateCodeApiRequest>({
    mutationFn: (vars) => api.post('/codes', vars),      // server echoes the row (same id if it honors client ids)
    targets: [{
      key: codesKey,
      current: (list: readonly CodeDto[], vars) => [
        ...list,
        {
          ...vars,
          id: Guid.createV7(),          // time-ordered → right sort position + stable React key
          scanCount: 0,
        } as CodeDto,
      ],
    }],
  });
}
```

Why v7 specifically here:
- **Stable key.** The id is the *actual* id, not a temp sentinel — so `key={row.id}` doesn't change when the server response replaces the optimistic row → no remount, no flicker.
- **Correct slot, no reshuffle.** Because v7 sorts by creation time, the optimistic row appears in the same position it will hold after confirmation; a v4 temp id would sort randomly and jump on reconciliation.
- **Idempotent insert (bonus).** If the backend accepts a client-supplied id (itself a `CreateVersion7` value server-side), the *same* Guid round-trips → a retried mutation can't create a duplicate.

---

## 7. Do products need it today?

**Not blocking — adopt opportunistically.** Current state across the frontends:

- `drydock.frontend-services` and `secrets-vault.frontend-services` type every id as plain **`id: string`** in `src/api/types.ts`; no client-side id generation anywhere.
- **Zero** `crypto.randomUUID` / `getRandomValues` / `uuid` usage in any product frontend or in the SDK `src/` today — nobody mints ids on the client yet.
- The SDK already ships `useOptimisticMutation` (`src/query/`), whose tests fabricate `{ id: string }` inline — the natural first consumer of `Guid.createV7()` once optimistic **inserts** (vs updates/removes) land in a product.

So the type is a **low-cost, forward-looking foundation piece**: it doesn't fix a current break, but it (a) gives ids compile-time provenance, (b) unblocks well-formed optimistic inserts the moment a product needs one, and (c) keeps the frontend id story a 1:1 mirror of the backend `System.Guid` — including v7. Build it small, wire the subpath, let products upgrade `id: string → id: Guid` field-by-field as they touch each DTO.
