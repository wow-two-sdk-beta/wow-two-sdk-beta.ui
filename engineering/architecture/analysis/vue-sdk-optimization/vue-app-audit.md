# Vue playground audit and optimization

Scope: all 30 existing files under apps/playground, plus the new navigation.ts. Source/scripts, template bindings,
fixture ownership, styles, HTML and build configuration reviewed. Config/package/CI unchanged. Exact 31-file path
and SHA-256 inventory: /private/tmp/sdk-vue-app-coverage.json. This lane changed 21 app source files and added two
DOM test files; no Git operations beyond read-only diff/status/show.

## Resolved

- Group views use asynchronous imports; the entry no longer imports all seven groups. Replaced entire cross-family
  namespace spreads with named moved-component imports, preserving each primary family namespace for AutoGroup.
- AutoGroup accepts that family's typed fixtures; removed its eager import of the global fixture index. It builds
  one map and one computed row list instead of repeated linear searches from the template.
- Migrated 44 legacy fixture cases to their components' current presentation domains, including required parent
  wrappers and typed data. All 371 unique existing example cases remain present. This prevents family splitting
  from silently losing examples that were previously found through the global index. Seven regression cases
  verify every family's example names and component identities against its independently imported barrel.
- Group links retain normal modified/auxiliary click semantics. Plain clicks update history without reloading,
  preserve other query parameters and hash, and keep diagnostic records. Popstate updates the selected group;
  invalid initial group values consistently select layout. Scope disposal removes the history listener.
- Theme dropdown uses root's new ThemeCatalog metadata without generating token payloads. Only the selected
  theme resolves and emits CSS; dark toggles reuse it. Removed all 183-theme CSS generation at every app boot.
  Invalid saved IDs fall back to smart-qr; storage denial does not stop the gallery. Theme watchers and style
  cleanup are explicit and used by HMR disposal. Root-level classes still theme portalled content.
- Diagnostic repeat counters now mutate reactive records, fixing repeats that failed to update their displayed
  count. Tuple-encoded keys prevent delimiter collisions. Demo boundaries still isolate component errors and
  now record their first captured failure in the diagnostics panel instead of hiding it from app.errorHandler.
- The native theme selector now has an accessible label.

## Validation and measured output

- pnpm build passed after root's ThemeCatalog API addition: library bundles, declaration emit,183-theme CSS/JSON.
- pnpm -C apps/playground build passed: app vue-tsc + production Vite build.
- pnpm exec vitest run --project dom tests/unit/playground:2 files /13 tests passed.
- pnpm exec eslint tests/unit/playground passed. Existing ESLint config globally ignores apps/playground;
  no app-lint pass is claimed. App source is checked by vue-tsc and build; Prettier check passed all app source/tests.
- Before build: single entry 1,319.79 kB /350.26 kB Vite gzip. After build: entry 118.97 kB /43.33 kB Vite gzip.
- Default layout's complete statically reachable emitted JS graph (entry+selected group+shared imports) is about
  278 kB, vs the original 1,320 kB eager bundle. About 79% fewer uncompressed JS bytes for the default group. The
  exact file graph and raw/gzip byte counts are in /private/tmp/sdk-playground-bundle.json. CSS remains about 140 kB.
  These are emitted-artifact measurements, not browser timing or network-transfer measurements. Other SDK lanes
  were editing shared source during the sweep, so tiny bundle deltas are not attributed solely to this lane.

Evidence logs: /private/tmp/sdk-playground-before.log, /private/tmp/sdk-playground-after.log,
/private/tmp/sdk-playground-library-build.log, /private/tmp/sdk-playground-tests.log,
/private/tmp/sdk-playground-format-check.log, /private/tmp/sdk-playground-test-lint.log.

## Remaining evidence boundaries / candidates

- Forms is still a 554 kB lazy group chunk; its full breadth gallery legitimately loads the whole forms family.
  Splitting individual expensive examples or viewport mounting can be considered after real interaction profiling;
  no change that would hide diagnostics or alter family coverage was made speculatively.
- Generated theme status comes from registry metadata; smart-qr is a candidate awaiting visual review, not a
  validated theme claim. Unit tests use a small mocked catalog to assert generation selection/cleanup behavior.
- Real-browser gallery layout/focus and all seven theme/group interactions remain parent QA. Suggested serve:
  pnpm -C apps/playground dev --host 127.0.0.1 (port 5176); inspect all seven ?g= values, plain/modified links,
  back/forward, themes/dark mode, diagnostics and [data-demo-error]. Fake-DOM tests are not visual certification.
- Legacy global fixture index remains available without participating in gallery startup. Its aggregate array
  allocation is limited to explicit aggregate consumers.
