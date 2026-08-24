# Frontend SDK session — handoff

*Last updated: 2026-08-15*

> State + open items for the `@wow-two-beta/ui` (React) session covering: the 27-bug fix campaign, the Showcase + Theme Studio apps, the Button/Select polish, the library-wide `is*`/`on*` prop-naming migration, and the theme engine (183 themes + `smart-qr` validated).
> **Peer handoff:** [`conventions-handoff.md`](conventions-handoff.md) — the parallel lane's enum-alignment + doc sweep + nit backlog. Read both; they cover the same repo.

---

## ⚠️ Read first — the repo was restructured mid-session

A parallel lane moved the whole SDK into the standard wow-two layout **and** reorganized `src/`. Everything below now lives at the **new paths**. Our session's work was uncommitted at the old root paths; the lane committed it as part of the move, so it survived — the tree is now **clean + committed** (`@wow-two-beta/ui` **v0.0.108**).

| Old path (this session edited here) | New path |
|---|---|
| `wow-two-sdk-beta.ui/src/{domain}/…` | `…/engineering/codebase/wow-two-front-beta-sdk/src/presentation/{domain}/…` |
| `src/utils`, `src/hooks`, `src/icons`, `src/primitives`, `src/themes` | `src/foundation/{utils,hooks,icons,primitives,themes,…}` |
| `src/utils/Environment.ts` | `src/foundation/utils/Environment/Environment.ts` (folder-per-util now) |
| `apps/{showcase,theme-studio,playground}` | `…/wow-two-front-beta-sdk/apps/{…}` (unchanged, just nested) |

- **React SDK root:** `engineering/codebase/wow-two-front-beta-sdk/`
- **Vue port (separate lane):** `engineering/codebase/wow-two-front-vue-beta-sdk/` + `.github/workflows/release-vue.yml`
- The lane also ADDED a lot on top of our work: `tests/` + `vitest.config.ts` (unit + story tests), const-object enum alignment, and many new `src/foundation/*` + `src/{router,query,auth,analytics,forms-engine}` modules. Our apps/themes/migration are absorbed but **not re-verified by me at the new structure** — see Resume step 1.

---

## Shipped this session (all committed at the new path)

- **Bug-fix campaign** — 27 adversarially-verified bugs across all domains (XSS in markdownEditor, primitives ref/focus/layer machinery, `peer-checked` pair, select/multiSelect hidden-input submission, SSR `"use client"`, …). *Pushed in round 1.*
- **Showcase app** (`apps/showcase`) — 20 routes (11 composed screens + 8 galleries + `/coverage`), chrome dogfoods the lib, auto-generated coverage manifest, 3-app Pages deploy. *Pushed in round 1.*
- **Button polish** — `isDisabled` (via migration) + `FormField` inheritance, long-press timer fix, `sr-only` loading name, `aria-disabled` while loading, icon-only dev-warn, `xs` 24px floor, glass×tone via shared `Tones`, forced-colors story, `standard.md`/`spec.md` resync.
- **Select polish** — `useFormControl`, trigger ARIA (`listbox` not `dialog`), keyboard-accessible searchable, closed-state label, `tv`-extend `inputBaseVariants`, `data-state`, clear ≥24px, `clearLabel`, `Select.standard.md` authored.
- **`useTypeahead`** (`foundation/hooks`) — APG type-to-select, wired into `Listbox` (open list) + `Select` closed trigger. *Deferred: MultiSelect + nav/Menu.*
- **`is*`/`on*` prop convention migration** (library-wide) — standalone booleans → `is*`/`has*`/`can*`; controlled-value triads keep bare roots (`open`/`defaultOpen`/`onOpenChange`, `value`/…); native DOM attrs stay native. Convention doc written to `wow-two-ws/conventions/development/frontend/naming.md`.
- **`Environment.ts`** — `IS_DEV`/`IS_PRODUCTION` const-object enum; Button dev-warns dead-code-eliminate in prod.
- **Theme Studio** (`apps/theme-studio`, 3rd app) + **theme engine** (`foundation/themes`) — zero-dep OKLCH, WCAG-AA validator, `generateTheme(seed)`, `themeToCss`, ships `@wow-two-beta/ui/themes` + `themes.css` + `themes.json`.
- **Themes: 183** — `smart-qr` (validated, extracted from its real `index.css`) + 24 curated + 158 pool candidates. Status model `validated`/`candidate` + `validatedThemes()`/`candidateThemes()`. Gallery filter + lifecycle in `THEMES.md`.
- **Deploy + Release** — `release.yml`: 3-app Pages artifact (storybook root + `/showcase` + `/theme-studio`) + `gh release create` per version with conventional-commit changelog. **Verify this survived the restructure** (Resume step 2).

---

## Open decisions (need your call)

1. **`open` vs `isOpen` inconsistency.** Overlays (`Dialog`/`Drawer`/`Popover`/`BottomSheet`/`CommandPalette`) kept `open` (triad); `DisclosureButton`/`SpeedDial`/`Tour`/`UndoBar`/`LoadingOverlay` got `isOpen` (no `defaultOpen` seed → treated as standalone). Coherent by rule but reads mixed → unify to all-`open` or all-`isOpen`.
2. **`smart-qr` theme AA.** Marked `validated` (you eyeballed light mode) but 11 fg/bg pairs miss auto-AA — light `subtle`/`muted`/`accent`, dark `primary` + the inherited tone families. Dark mode not yet visually validated. On the next in-app refine pass: nudge those tokens, re-sync into `foundation/themes/validated.ts`, keep `validated`.

---

## Deferred backlog

- **MultiSelect parity** — the family laggard: same ARIA pass + `isClearable`/`isSearchable`/`isLoading` + `useTypeahead` that Select/Listbox got.
- `useTypeahead` → wire into `MultiSelect` + `nav/Menu`.
- `options`/`renderItem` **data API** for the dropdown family (currently JSX-children only).
- **Unify family value-typing** — `Select` is generic `<K,V>`; `Combobox`/`MultiSelect` are `string`-only.
- Shared **item-registry hook** — Select/Combobox/MultiSelect/Listbox hand-roll near-identical registries.
- **Tone-vocab ADR** — `Button.danger` vs `FAB.destructive` vs `Spinner.brand`.
- **Storybook theme catalog** story (swatch grid + light/dark toggle over the 183 themes).
- **Showcase `RouteHeader`** — `CollapsibleTrigger` wraps interactive content → `<button>`-in-`<button>` console noise (pre-existing; same class as the Theme Studio gallery bug already fixed).
- Promote standout **candidate → validated** themes after eyeballing in an app.

---

## Resume steps

1. **Re-verify at the new path** (the restructure moved every import): `cd engineering/codebase/wow-two-front-beta-sdk` → `pnpm typecheck` · `pnpm lint` · `pnpm build` (emits `dist/themes.css` + `themes.json`, 183 themes) · `pnpm --filter showcase build` · `pnpm --filter theme-studio build` · `pnpm build:storybook`. Fix any seams the move left in our apps/themes.
2. **Verify CI** — `.github/workflows/release.yml` still does 3-app Pages deploy + `gh release create` and points at the new `apps/*` paths post-restructure.
3. **Settle the 2 open decisions** above.
4. **Push** — the first push to `main` exercises the release pipeline (npm publish + GitHub Release + 3-app deploy). Watch the run.

- Dev servers (launch.json, workspace root): `ui-showcase` (5174) · `ui-theme-studio` (5175). Update their `-C` paths to the new `engineering/codebase/wow-two-front-beta-sdk/apps/…` if broken.
- Apply any theme to any app: `import '@wow-two-beta/ui/themes.css'` + class `theme-{id}` (+ `dark`). Prefer `theme-smart-qr` for production.

---

## Coordinate with parallel lanes

- **Conventions sweep** → [`conventions-handoff.md`](conventions-handoff.md): enum alignment (const-object + shared registries), lib-wide doc pass, a nit backlog. Overlaps our migration — reconcile naming before more sweeps.
- **Vue port** → `engineering/codebase/wow-two-front-vue-beta-sdk/` — mirror of the React SDK; the theme engine/`is*` convention should port there too.
