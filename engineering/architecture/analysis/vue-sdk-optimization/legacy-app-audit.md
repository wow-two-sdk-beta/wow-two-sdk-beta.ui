# React demo app audit — 2026-09-13

Scope: `engineering/codebase/wow-two-front-beta-sdk/apps/{playground,showcase,theme-studio}` and shared app alias map, app-only changes. React library and React release remain parked; no library/config outside apps, CI or Git mutations made.

## Coverage

All app implementation code, chrome, routes, fixtures, app build config, stylesheet inputs and showcase manifest generator reviewed. Large showcase screens/galleries read as TypeScript AST-condensed JSX (all executable logic, JSX expressions and wiring retained; static copy/style attributes omitted for that pass). Main modified source read directly. No claim of exhaustive visual review of every gallery or binary sample. Coverage: `/private/tmp/sdk-legacy-app-coverage.json`.

## Fixed

1. Playground build was broken by four obsolete Select props: `clearable` and `disabled` become `isClearable` and `isDisabled`. Baseline tsc reproduced all four failures; post-change builds pass.
2. Playground aliased SDK source but never scanned that source for Tailwind classes. Added app CSS entry with the same `@source ../../../src` contract as showcase/studio. Previously the select's SDK utility classes were absent; emitted CSS grows from 12.64 KB to 136.46 KB (20.24 KB gzip), an intentional correctness change.
3. Playground themes now mirror to document.body for portaled Select content; cleanup restores pre-existing classes.
4. ThemeStudioProvider restores both the previous theme class and dark class on cleanup. Previous dark mode survived unmount incorrectly.
5. Theme gallery decorative previews are actually inert, in addition to aria-hidden. Their nested buttons can no longer receive keyboard focus while hidden from assistive technology.
6. Generator reads `theme.meta`, eliminating the second complete `validateTheme` call per seed. `generateTheme` already validates both token sets. PreviewBoard is memoized, so seed changes update CSS without rebuilding the entire independent demo form/table subtree. Input local state remains local. No arbitrary seed restrictions or debouncing added.
7. Theme export now emits `name: theme.name` instead of silently replacing the display name with its ID.
8. Showcase sample assets use `./samples/...`; absolute `/samples/...` previously escaped GitHub Pages path prefixes. Auth completion's home link now uses `#/`, respecting HashRouter and the deployment prefix.
9. FeedbackGallery no longer mounts a second global Toaster. The shell already owns one, so each queued notice previously rendered twice on the gallery route. Rebuilt generated coverage manifest reflects that removal.
10. Showcase theme context value memoized to avoid publishing unchanged context values whenever the shell rerenders.

## Baseline and validation

- Before changes: showcase build PASS; theme-studio build PASS; playground build FAIL (4 TS2322 stale prop errors).
- After changes: all three full `pnpm --filter <app> build` PASS; all three independent `pnpm exec tsc --noEmit -p apps/<app>/tsconfig.json` PASS.
- Added `apps/tests/AppSmoke.test.mjs`, self-hosting browser regressions against built app artifacts: playground source styles/portal theme/disabled and clear controls, nested-path showcase media and one toast per event, theme inert preview/seed CSS updates/form retention/export display name.
- Exact run: `PLAYWRIGHT_CHANNEL=chrome node --test apps/tests/AppSmoke.test.mjs` from React package. Root will run serialized after its core browser checks. Test source syntax passes. Browser result remains PENDING and must not be reported as passing yet.
- Local runtime baseline: installed React Playwright expects absent Chromium1228; host has1234, and browser launch plus loopback binding need native sandbox escalation. My single pending escalation was canceled at root's request to avoid superseding its active approval. No browser/server process remains from this lane.
- No React prettier dependency exists; new test/style files formatted with the already installed sibling Vue Prettier3.9.6. React eslint config ignores apps, so app lint would provide no coverage and is not represented as a gate.

## Optimization conclusions and limits

All 20 showcase routes and all 4 studio routes are already lazy, with dynamic per-page chunks. Showcase initial main chunk essentially unchanged (390.10 KB, 118.47 KB gzip), so no startup byte improvement claimed. Theme studio main420.43 KB (130.22 KB gzip); full themes stylesheet dominates CSS because gallery intentionally previews every theme. Avoided a speculative chunking or registry rewrite in the parked React library. Generator improvement is reduced computations/render work, not a measured app latency claim.

The finite fixture arrays (14 tasks,20 activities,30 messages,25 themes) don't justify virtualization or preemptive indexing throughout these apps. Stateful demo timeouts/intervals for auth/dashboard/chat/onboarding clear on effect cleanup. Inbox and layout fake refresh callbacks remain short600/700ms promises without cancellation; after route unmount React ignores their local state update. They are bounded demo-only work, no retained subscription. If these become real network-backed examples, replace with cancellable request ownership.

Remaining non-app fork: any fixes to the React SDK itself (portal scoping beneath simultaneously different themed previews, shared library bundle/CSS size, comprehensive React behavior parity) require reopening that parked scope. No new user decision blocks the app-only changes.

## Changed files

- apps/playground/src/App.tsx
- apps/playground/src/main.tsx
- apps/playground/src/styles.css (new)
- apps/playground/src/scenarios/SupplyFilterBarMock.tsx
- apps/showcase/src/galleries/FeedbackGallery.tsx
- apps/showcase/src/manifest.gen.json (generated)
- apps/showcase/src/screens/auth/AuthScreen.tsx
- apps/showcase/src/screens/media/MediaScreen.tsx
- apps/showcase/src/theme/ThemeContext.tsx
- apps/theme-studio/src/components/PreviewBoard.tsx
- apps/theme-studio/src/pages/ExportPage.tsx
- apps/theme-studio/src/pages/GeneratorPage.tsx
- apps/theme-studio/src/theme/ThemeContext.tsx
- apps/theme-studio/src/theme/ThemePreviewScope.tsx
- apps/tests/AppSmoke.test.mjs (new)
