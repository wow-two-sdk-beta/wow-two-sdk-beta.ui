# Vue SDK stateful-core audit

## Coverage

- Reviewed all 166 TypeScript/Vue implementation and export files in assigned auth, formsEngine, query, router, flags, analytics, feedback, state, async, storage, history, commands, HTTP, OAuth, validators, and config scopes.
- Added all 8 i18n implementation/export files to review, including the new shared cache; 174 reviewed paths total.
- Manifest: `/private/tmp/sdk-state-coverage.json`.
- Changed source/test paths: `/private/tmp/sdk-state-changed.json`.
- Applications and CI were not audited in this lane. No Git mutations were performed.

## Resolved defects and optimizations

| Area | Trigger and previous behavior | Resolution | Evidence |
| --- | --- | --- | --- |
| Persistent state | Changing account/storage key to a missing key retained the preceding key's value; an immediate functional write copied it into the new key | Reset from the current key or initial value synchronously; honor localStorage clear events and ignore sessionStorage events | `PersistentState.dom.test.ts`, 2 tests |
| Router effects | A guard rejected a navigation but afterEach still overwrote document title, metadata, and persisted route with the rejected target | All three hooks ignore failed navigation | `NavigationEffects.dom.test.ts` |
| Router prefetch | One network rejection permanently marked a lazy importer as already prefetched | Drop failed entries and permit a later intent to retry; retain concurrent/success deduplication; observe synchronous importer throws | `NavigationEffects.dom.test.ts` |
| Undo history | Transactions and coalesced input created deeply nested do/undo closures; long groups overflowed the JS call stack | Constant-time tree concatenation and iterative traversal; preserve forward/reverse action order | Two regressions each replay 30,000 grouped actions |
| Async cancellation | An already-aborted wrapper rejected before observing its already-started input promise; a thrown thenable left timer/listener resources alive | Observe the input on every cancellation path; assimilate thenables through Promise.resolve so settlement runs cleanup | `Cancellation.test.ts`, 4 tests |
| Limiter | NaN concurrency parked every task indefinitely | Throw a construction-time RangeError; existing finite/fractional and Infinity policy retained | `Cancellation.test.ts` |
| Form dirty state | Two files with identical metadata but different content compared equal; cyclic snapshots overflowed; symbol-key and sparse-slot edits were ignored | File/Blob identity, pair-aware cycle comparison, own enumerable symbol and sparse-slot comparison | `ValueIdentity.test.ts` |
| Form paths/errors | Prototype-named fields were read as inherited values or assigned through the __proto__ setter; constructor error arrays collided with Object.prototype | Own-property path reads, data-property writes, null-prototype message maps | `ValueIdentity.test.ts`, schema/server/house paths |
| OAuth loading | Failed script remained in DOM, so retry subscribed to events that would never fire again | Remove failed script and both event listeners; permit a fresh shared loading attempt | `GoogleIdentity.dom.test.ts` |
| OAuth lifetime | GIS callbacks captured stale or disposed hooks; delayed failures could overwrite newer client state | Generation and client-ID guards for success/failure/credentials; clear client on disposal | `GoogleIdentity.dom.test.ts` |
| Validator formats | Four-digit years below 0100 failed due to Date.UTC remapping; UUID/date patterns accepted final line terminators | Preserve literal full year; require true end of input | `CalendarBoundaries.test.ts`, 9 tests |
| Query ownership | A changed provider prop caused unmount of a different client than the injected/mounted one | Capture the provider's client for its lifetime; documented remount contract | `QueryOwnership.dom.test.ts` |
| Paginated queries | Cached page queryFn read live page ref; inactive page refetch could cache the current page under an old key | Capture the page once in the matching query-options generation | `QueryOwnership.dom.test.ts` |
| Locale messages | Direct translation callbacks were invoked as getters with no arguments; inherited message keys could crash interpolation | Messages accept direct values or refs/computed; own-property lookup for dictionaries and interpolation variables | `MessageOwnership.dom.test.ts`, 3 tests |
| Intl caching | Every locale/options combination stayed forever; reordered equivalent option objects duplicated constructors | Shared 256-entry LRU cache, canonical option order; eviction never restricts accepted locale/options or invalidates existing users | `IntlCache.test.ts`, 2 tests |

## Compatibility notes

- `provideLocale(locale, messages)` treats function messages as translator values. Reactive getters use `computed(() => messages)`; `LocaleProvider` now passes a prop ref. No other repository call sites required changes.
- `QueryProvider.client` is explicitly captured for the subtree lifetime. Remount the provider to switch clients.
- Files compare by identity, including files with identical name/size/timestamp/type. This prevents false clean states when bytes differ.
- `pLimit(NaN)` throws rather than silently creating an unusable queue.

## Validation

- Scoped Prettier and ESLint passed for all changed files.
- Focused existing/regression suites: 141 tests passed across 20 files before adding i18n coverage.
- i18n suites: 8 tests passed across 4 files.
- Full vue-tsc found no owned-file errors; concurrent non-owned lane errors were handed to root (Slot, DOM lifecycle and presentation test typings).
- Combined final run passed 155 tests across 25 files, including the existing GoogleSignInButton integration suite.

## Remaining decisions and boundaries

- No user decision is required for the fixes above.
- GIS exposes one page-global initialized client. Concurrent independent client-ID providers remain a vendor-global integration limitation; the patch prevents callbacks into stale/disposed hooks but does not invent a multi-client scheduler.
- Optimistic transactions currently serialize per QueryClient. This preserves rollback correctness; concurrency by disjoint target keys is a future architectural optimization, requiring overlap analysis for prefix invalidation and external cache writers.
- No production consumer or workload was available. Optimizations prove algorithmic behavior and bounded retention, not an application latency claim.
