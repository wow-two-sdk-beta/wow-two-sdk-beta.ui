# Showcase Site — Plan

*Last updated: 2026-06-12*

A deployable, routed sample site that wires the library's ~230 components together as a real product would — no backend, readonly browse-and-click (local state only, refresh resets). Complements Storybook: stories prove components in isolation; the showcase proves they compose.

## Decision

Build a **new `apps/showcase`** Vite app — do not extend `apps/playground`:

- `pnpm-workspace.yaml` already globs `apps/*` — zero workspace config.
- Playground is positioned as an ad-hoc prototyping scratchpad; the showcase is a curated, deployed artifact with a different lifecycle and deps (`react-router-dom`).
- Reuses playground's alias-to-source vite trick (`@wow-two-beta/ui/*` → `../../src/*/index.ts`) — renders live library source with HMR, never depends on a stale `dist/`.
- The showcase **dogfoods the library**: its chrome is `AppShell` + sidebar nav + `CommandPalette` (Cmd+K route jumper) + `Toaster`.

## Two content tiers

1. **Per-domain kitchen-sink galleries** (8 pages) — every component renders somewhere; guarantees the long tail.
2. **Composed realistic screens** (~12) — components working together over realistic fixture data.

## Structure

```
apps/showcase/
├── package.json              # private; deps: @wow-two-beta/ui (workspace:*), react, react-dom, react-router-dom
├── vite.config.ts            # playground aliases + base: './'
├── index.html · tsconfig.json
├── public/samples/           # tiny license-free media fixtures (<500KB total)
├── scripts/build-manifest.mjs# scans route imports → src/manifest.gen.json
└── src/
    ├── main.tsx              # StrictMode + HashRouter + styles.css
    ├── App.tsx               # shell: AppShell chrome, CommandPalette, Toaster, theme classes
    ├── routes.tsx            # single registry { path, title, group, module, Component(lazy), bare? }
    ├── manifest.gen.json     # generated — route → components-used map
    ├── theme/                # ThemeContext (dark + theme-haven classes on root div), haven.css
    ├── chrome/               # SidebarNav, ThemeToggle, RouteHeader (components-used chips)
    ├── fixtures/             # typed deterministic static data (users, orders, metrics, messages, events, files, activity)
    ├── galleries/            # 8 kitchen sinks: Actions/Display/Feedback/Forms/Layout/Nav/Overlays/Primitives
    ├── screens/              # landing, dashboard, settings, chat, auth, projects, editor, media, onboarding, billing, inbox
    └── coverage/             # CoveragePage — manifest vs barrel exports, % covered, unused list
```

## Route map

| Route | Purpose |
|---|---|
| `#/` | Landing — pitch, domain cards, live coverage stat, Storybook link |
| `#/galleries/:domain` ×8 | Kitchen sink per domain — all 230 components, `SectionHeader` + `ScrollSpy`/`TableOfContents` in-page nav |
| `#/app/dashboard` | Flagship ops dashboard — `AppShell`, `Stat`, `Sparkline`, `DataTable`, `DataGrid`, `ActivityFeed`, `HeatmapCalendar`, skeleton→content |
| `#/app/settings` | Tabbed settings — the form-field families |
| `#/app/chat` | Messaging — `MessageList`, `ChatComposer`, reactions, presence, typing |
| `#/auth` (bare, no shell) | Sign-in → sign-up → 2FA (`PinInput`) → reset, `Wizard`/`ProgressSteps` |
| `#/app/projects` | Tracker — tables, `Gantt`, `EventCalendar`, `Drawer` detail, `SwipeActions`, `ContextMenu` |
| `#/app/editor` | Docs/content editing — `MarkdownEditor`, `CodeEditor`, `DiffViewer`, `TableOfContents` |
| `#/app/media` | Media library — players, `Carousel`, `PdfViewer`, visual flourish |
| `#/app/onboarding` | First-run — `Tour`, `OnboardingChecklist`, `Wizard`, popovers |
| `#/app/billing` | Checkout — `AddressForm`, money inputs, invoice table, confirm dialog |
| `#/app/inbox` | Notification hub — `NotificationCenter`, feeds, `PullToRefresh`, `LiveCursor` |
| `#/coverage` | Manifest page — per-route component chips, % covered, unused list |

## Data strategy

- Hand-written deterministic typed fixtures in `src/fixtures/` — no faker, reproducible screenshots/deploys; shaped like real product data (ids, timestamps, enums), not lorem-ipsum.
- Interactivity = local `useState`/`useReducer`; mutations update memory + fire a `Toast`; refresh resets — the readonly contract.
- Async feel simulated: `setTimeout` skeleton→content, typing loops, fake submit spinners.
- Binary fixtures tiny, in `public/samples/`.

## Routing & state

- `react-router-dom` v7 `HashRouter` — correct for GitHub Pages (no SPA-fallback hacks), works at any base path; pairs with Vite `base: './'`.
- `React.lazy` per route — forms (72) / display (66) galleries are big chunks.
- No global store; ThemeContext writes `dark` / `theme-haven` classes on the root div (mirrors `@custom-variant dark` in `src/index.css`).
- `routes.tsx` is the single source of truth driving sidebar, CommandPalette items, breadcrumbs, and manifest keys.
- `scripts/build-manifest.mjs` scans route modules for `@wow-two-beta/ui/{domain}` named imports + parses lib barrels → `manifest.gen.json`; CoveragePage diffs → CI can assert 100%.

## Deployment

- Merge into the existing single Pages artifact (`.github/workflows/release.yml`): after `pnpm build:storybook` → `pnpm --filter showcase build` → `cp -r apps/showcase/dist storybook-static/showcase` → existing upload step.
- Storybook stays at the root URL; showcase at `/showcase/`. Showcase build sits **after** `npm publish`, so a broken showcase never blocks a release (fix-forward).

## Risks / mitigations

- **Coverage long-tail** → build the manifest script early; CI assertion.
- **Giant gallery pages** → lazy chunks + in-page sections; overlay demos mount behind trigger buttons, never auto-open (portals/focus traps/scroll locks fight otherwise).
- **Artifact weight** → keep media samples tiny.
- **Alias-to-source** → lib type errors surface in showcase CI; acceptable (typecheck already gates release).
- **Haven theme** is playground-local → copied into showcase deliberately; demo both themes.

## Effort

7–9 sessions solo (S1 deployed skeleton → screens → galleries → coverage); compressed to a single multi-agent build pass in practice.
