# Vue SDK optimization sweep

*Sweep verified locally: 2026-09-13. Clean-build CI correction verified: 2026-09-15. Hosted publication remains open.*

## Scope and evidence

The owner authorized correctness and performance corrections throughout the Vue SDK, followed by its playground and the legacy React showcase/playground/theme studio, then CI. There are no production consumers. React library implementation and release remain parked; React app-only fixes are included.

The Vue source inventory contains 1,237 TypeScript/Vue files across 58 capabilities. Stateful core and browser-core reviews read implementation bodies across their assigned capabilities. Presentation inspection combines a full content/risk inventory with semantic inspection of 58 full source files and 9 selected functions. This is a whole-SDK architectural and risk sweep; it is not an exhaustive proof of every component behavior. Exact inspection categories and path lists are retained in the lane coverage files.

| Evidence | Scope |
| --- | --- |
| [Supporting core](supporting-core-audit.md), [coverage](supporting-core-coverage.json) | Errors/results, formatters, resilience, styles, color and emoji |
| [State core](state-audit.md), [coverage](state-coverage.json) | State ownership, forms, HTTP/auth/query/router, async/history, validators and i18n |
| [Browser core](browser-audit.md), [coverage](browser-coverage.json) | 20 browser capabilities, lifecycle and scale boundaries |
| [Components](components-audit.md), [coverage](components-coverage.json) | Presentation, primitives, DOM and icons; semantic versus inventory coverage distinguished |
| [Vue playground](vue-app-audit.md), [coverage](vue-app-coverage.json) | All group views, fixtures, navigation, theme/diagnostic lifecycle |
| [React apps](legacy-app-audit.md), [coverage](legacy-app-coverage.json) | Showcase, playground and theme studio executable code |

Lane reports are completion snapshots. Their intermediate pending checks and temporary log paths are superseded by the combined verification section below. Coverage hashes describe the inspected snapshot; later root corrections are represented by Git history and tests.

## Pure core corrections

| Area | Previous failure or cost | Final behavior |
| --- | --- | --- |
| Exact numbers | Each parsed value allocated its own arithmetic/comparison closures | Shared frozen methods with private WeakMap state; one shared own serializer rejects unsupported structured cloning |
| Exact number equality | Shared prototypes made ordinary property-based comparison insufficient | Generic shallow/deep value comparison explicitly delegates exact numeric values to exact equality |
| Tree building | Repeated scans and recursion scaled poorly; duplicate IDs could multiply nodes | Parent indexing, iterative traversal and explicit cycle handling; each input contributes one node |
| Tree transforms | Deep chains could overflow the call stack | Iterative find/flatten/map; cyclic mapping fails explicitly |
| Native ranges | A step below floating-point resolution could loop forever | Throw when the next native number cannot advance |
| Collection records | Prototype-named keys could invoke inherited setters | Preserve all supplied own keys as ordinary data properties |
| Dates | Native parsing rolled impossible ISO calendar dates forward | Validate calendar days before native conversion; reversed day intervals stay empty |
| File names | Long extensions/fallbacks exceeded requested lengths; replacement metacharacters reinserted invalid input | Honor the explicit caller length contract, replace literally, remove trailing spaces introduced by truncation |
| Text formatting | Custom slug separators were treated as regex/replacement syntax; NaN mask visibility exposed the secret | Literal separators, empty separators supported; invalid visibility fully masks the string |
| CSS radius tokens | Inherited object keys resolved to prototype functions | Only own token keys resolve; raw CSS strings remain raw |
| GUIDs | A final newline could match the dollar anchor | Validate the entire supplied token |
| Logger | Prototype-named context fields were lost during copying/redaction | Retain own fields while redacting matching secrets |
| Themes | Importing the catalog generated every candidate and all contrast metadata | Resolve candidate colors lazily; metadata enumeration needs no generation |
| Theme colors | Malformed/nonfinite OKLCH components entered contrast math | Reject malformed tokens and invalid color-domain values |

These corrections do not make restricted numeric representations the default. The filename limit is an explicit caller contract; calendar/color checks validate their domain; non-advancing native ranges fail instead of hanging. Exact numeric values retain their unrestricted precision-oriented API and explicit arithmetic methods.

## Measured effects

Three fresh Node processes per before/after sample, same installed runtime and dependencies, 100,000 retained parsed exact values. The baseline is the previously verified local 0.0.5 tarball from the preceding conventions sweep, not a claim about the public npm artifact. [Raw samples](core-benchmark.json); reproduce with `node --expose-gc scripts/benchmark-core.mjs [package-directory]` after a build.

| Measurement, median | Before | After |
| --- | ---: | ---: |
| Retained heap for 100,000 exact values | 162,712,792 B | 27,657,728 B |
| Parse allocation time | 114.5 ms | 60.2 ms |
| Theme-module import | 261.1 ms | 27.9 ms |
| First selected candidate lookup | 0.02 ms | 3.02 ms |

Exact-value retention is about 83% smaller. Theme computation moves to the first requested candidate; enumerating all themes still intentionally computes all of them. These microbenchmarks do not establish real application latency.

The Vue playground's default group's reachable JavaScript shrank from approximately 1.32 MB to 278 kB (about 79% fewer raw bytes). The entry alone is about 119 kB. [Measured emitted graph](playground-bundle.json). All 371 fixture cases remain available across seven lazy groups. The forms group is still large because it demonstrates the whole family. React app improvements fix behavior and eliminate duplicate work; no React startup speedup is claimed.

Deterministic scale regressions cover a 12,000-node tree, 30,000-action history groups, 150,000 sparkline points and virtual offsets above 2^32. DataTable extracts 128 sort keys for 128 rows rather than 1,458 comparator-time reads. These demonstrate algorithmic changes without timing thresholds.

## CI diagnosis and correction

The failed Vue release inspected during the audit was [run 34718320600](https://github.com/wow-two-sdk-beta/wow-two-sdk-beta.ui/actions/runs/34718320600), workflow run 8, commit `efaa23d6678b78524151571b004a8b1764cc3765`. Its typecheck reported missing `JsonEditorHelpers`, `JsonEditorContext`, `PdfViewer.vue`, `Fab.vue` and `Fab.variants`. The Git tree at that commit still recorded legacy uppercase spellings. macOS resolved local files while Linux rejected the imports. The job failed before npm publication; this run does not establish a credential problem.

The earlier local implementation commit `3ae7df7` records the case-only renames. The new capability gate additionally verifies imports against exact filenames and checks Git's index for missing case-only renames. Two host-independent regressions prevent this macOS/Linux discrepancy from recurring.

The successful Vue release inspected during the audit was [run 31788268470](https://github.com/wow-two-sdk-beta/wow-two-sdk-beta.ui/actions/runs/31788268470), August 14, before the later failed releases. These observations predate the owner's implementation push on September 14; they do not establish the status of the newly triggered runs.

Release changes:

- Check out current main when a queued release starts, then validate source/types/SFCs/lint/format/tests, the built playground and its browser smoke, and an independently installed packed consumer.
- Select the next `0.0.y` after the maximum of the manifest and published npm patches. A prior npm publish followed by failed Git bookkeeping no longer traps later runs on an occupied version. Malformed registry data fails explicitly.
- Recheck remote main immediately before publication. Publish exactly the verified tarball, then atomically push the matching version commit and annotated tag. Never rebase an already-packed release onto unverified source.
- Use current verified Node 24 action runtimes: [checkout 7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node 7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0), [pnpm setup 6.1.0](https://github.com/pnpm/action-setup/releases/tag/v6.1.0).
- Keep Vue and React concurrency groups separate. A shared group can evict a pending run from the other package because GitHub retains only one pending run per group.
- Exclude React app-only edits from automatic React publication. React package behavior/release upgrades and its legacy advisory test workflow remain parked; its existing automatic test retry is not used by the gated Vue release.

September 15 follow-up: [run 34932447116](https://github.com/wow-two-sdk-beta/wow-two-sdk-beta.ui/actions/runs/34932447116)
at `f6c396c` failed in typechecking before publication. Playground state tests import `theme.ts`, whose public theme
subpath resolved to `dist`; the test TypeScript configuration lacked the playground's source aliases. Existing local
build output masked the dependency. A temporary package copy without `dist` reproduced both CI diagnostics and two
DOM test failures. The test TypeScript configuration now resolves playground public subpaths to source; Vitest reuses
the playground's manifest-derived source aliases. Declaration-build and published-package resolution stay unchanged.

npm and Git are separate systems: a push arriving after the final head check can still leave npm published while the atomic Git push fails. The next run can recover by advancing beyond the published version. This is explicit recovery, not a claim of a cross-system atomic release.

September 15 publishing follow-up: run `34934970480` at `2f6aa63` passed every validation, build, playground,
packed-consumer and source gate. npm rejected publication of `0.0.6` with `E404`; the registry remains at `0.0.5`.
The publish step received a masked token. The signed-in npm account `sulton-max` retains package write access,
but its only listed token, `npm-token`, expired August 18, 2026. It had package read/write and bypass-2FA enabled.
The GitHub secret's exact identity cannot be matched through read-only secret metadata; expiration is the likely
cause, not a proven equality between that token and `NPM_TOKEN`.

Prepared [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/): the Vue job requests `id-token: write`
and publishes the same verified tarball without a stored npm token. Removed setup-node's token-placeholder npmrc;
the publish command names the public registry explicitly. Node 24 is retained; npm requires CLI 11.5.1 or newer.
Workflow YAML and all shell step syntax pass; three release-version helper tests pass. Hosted OIDC publication
is not verified. Before pushing this change, the owner must authorize the package-side trusted publisher:

- Provider: GitHub Actions.
- Organization: `wow-two-sdk-beta`.
- Repository: `wow-two-sdk-beta.ui`.
- Workflow: `release-vue.yml`.
- Environment: empty (the workflow declares none).
- Direct `npm publish`: allowed, matching the existing automatic release flow.

No npm settings or GitHub secrets were changed. Creating this trust still requires owner confirmation.

## Combined verification

- TypeScript source/test checks, exact-path capability graph and all 407 SFC compilations passed.
- ESLint and source/test Prettier passed.
- Unit, DOM and SSR: 120 files / 1,774 tests passed, including the final supporting-core corrections.
- Library/declarations/theme output and Vue playground production builds passed; all 183 themes pass their declared contrast pairs.
- All three React app builds and independent app TypeScript checks passed in the app lane.
- Five Node release/path helper tests passed. All three workflow YAML files parse; all shell steps pass `bash -n` with GitHub expressions substituted.
- The owner ran the native verification script: all 30 Chromium ordinary/forced-colors tests passed, and the built Vue playground passed all seven groups, navigation, theme and diagnostic checks.
- All three React app browser checks passed, including theme-studio applied CSS updates and retained form input.
- Packed export/type/JavaScript/CSS checks and a fresh npm consumer installation passed. Optional-peer symlink cleanup uses `unlinkSync`, preserving the linked dependency.
- The final two native checks ran through manual approval under the workspace sandbox configuration; Full access was unnecessary. `/private/tmp/sdk-native-verification.json` records all four native check groups with exit code 0.
- September 15 correction: `vue-tsc` and all 1,774 unit/DOM/SSR plus 30 Chromium tests passed in the temporary copy
  without `dist`. Full `pnpm typecheck` (including the Git-index gate and 407 SFCs), ESLint and changed-config formatting
  passed in the SDK checkout. The temporary copy reused installed dependencies; it was not a fresh dependency install.
- GitHub confirms the owner's documentation commit `f6c396c` reached main. Its release failed as diagnosed above.
  The correction awaits the owner's commit/push and a successful hosted run; npm version and matching tag remain open.
  No agent commit or push was performed during this handover.

## Remaining analysis candidates

These are proposals for the next discussion, not hidden incomplete fixes in the approved batch:

1. Exact numeric UI and schema adoption: decide which public form controls and endpoint contracts should accept exact values end-to-end. The codec prototype does not silently migrate native-number controls.
2. Component completeness: select behavioral contracts for the remaining inventory-only presentation surfaces; explicit browser/keyboard/assistive-technology coverage gives more confidence than a blanket file-count claim.
3. Large variable-height lists: prefix-tree measurement updates could avoid O(n) rebuilding, but need a measured workload before changing the structure.
4. Query optimistic transactions: per-key concurrency could improve throughput, but requires overlap/rollback rules for prefix invalidations and external cache writers.
5. Browser resource pooling: observer/media-query sharing needs ownership and reentrancy contracts. Current cleanup is corrected without a speculative global pool.
6. Forms gallery: split expensive fixtures or mount by viewport only after real interaction profiling; preserve diagnostic visibility and all cases.
7. Device and visual coverage: WebKit/Firefox, real media/speech/notification permissions, and Smart QR app visual validation remain explicit platform checks.
8. React library and release: remain parked. App-only repairs do not establish Vue/React parity.

Release confirmation precedes prioritizing those candidates. The owner pushed the implementation; verify the resulting Actions run, npm version and matching Git tag. Documentation and benchmark tooling remain in the final handover batch.
