# Vue browser core audit

## Scope and evidence

Reviewed every source file in 20 assigned browser capabilities, including implementation bodies, models, enums,
barrels and the AnimatedLayout specification. Exact paths and SHA-256 snapshots live in sdk-browser-coverage.json.
Static review is not proof of every browser implementation or all hardware/permission combinations.
No apps, CI, package configs or Git index/history were changed in this lane.

## Resolved

1. Breakpoints: removed eight-slot truncation. Subscribe to exactly the current scale size; remove replaced
   listeners and stop all on disposal. A ten-entry scale resolves its ninth position; shrinking to two entries
   leaves two listeners. Removed public MaxBreakpoints. The central media-query subscriber remains internal.
2. Polling: a direct callback was executed through toValue and its returned Promise/void called as a function.
   usePolling now accepts MaybeRef<PollFn> and calls unref(fn)(). The async callback is awaited; no overlapping ticks.
3. Uploads: remove/clear retain occupied slots until the aborted transport settles. Clear removes queued items
   before aborting transports. Invalid nonfinite concurrency uses the finite default. Owned useUploadQueue scopes
   clear their queue on disposal, cancelling in-flight work and preventing queued starts.
4. Leader election: closing an election detaches the subscription from an injected channel while preserving
   that externally owned channel. Timers all clear.
5. IndexedDB: late probe success closes its connection after timeout. Throwing open/delete onBlocked callbacks
   reject instead of skipping the timer and leaving a pending promise. Repeated blocked events reuse the deadline.
6. Binary codecs: hex/base64/base64url reject complete trailing line terminators instead of accepting the
   special JavaScript dollar-anchor match before final newlines.
7. Geolocation: clamp the haversine intermediate at its mathematical [0,1] bounds to prevent NaN for antipodes
   due to floating point rounding. This stabilizes an algorithm, not a restricted domain-number representation.
8. Virtualization: reject fractional measurement indices; avoid unsigned-32-bit truncation in binary search.
   A virtual offset accessor with more than 2^32 rows converges in fewer than 40 reads without allocating rows.
9. Workers: one-shot worker calls settle messageerror and release worker/object URL rather than hang indefinitely.
10. Permissions: concurrent notification permission calls share one browser prompt; pending completion cannot
    write the disposed hook state.
11. Paste: an explicitly null target remains detached instead of falling back to a global window listener.
12. Selection: exact-number comparison and filter equality use ExactNumber operations, not coercion/string order.
    Typeahead ignores composition keystrokes so IME input does not navigate the collection.
13. Gestures: a second pointer ending cannot cancel the first pointer's long press; pointercancel never commits a swipe.
14. Speech: a replaced recognizer's callbacks cannot overwrite new-session state or invoke old consumer callbacks;
    disposed recognition cannot allocate another recognizer and disposed synthesis cannot enqueue utterances.
15. Socket: an onOpen callback closing the client cannot leave a heartbeat interval installed afterwards.

## Validation

- 29 new focused regressions: 19 Node tests and 10 happy-dom tests, including parameterized boundaries.
- Combined selected existing+new suites: 8 files / 62 tests passed.
- Command: pnpm exec vitest run --project unit --project dom tests/unit/foundation/browser
  tests/unit/foundation/speech tests/unit/foundation/crypto tests/unit/foundation/idb.
- Test output: /private/tmp/sdk-browser-tests.log.
- ESLint passed on every touched source/test file; touched-file Prettier pass completed.
- Parent owns full types/SFC/format/lint/tests/build/packed consumer gates.
- Listener counts, prompt counts, callback counts and accessor counts are deterministic optimization evidence;
  no browser wall-clock speedup is asserted.

## Tradeoffs and remaining candidates

- A custom upload transport that ignores AbortSignal can retain a slot until its promise settles. This is
  deliberate: freeing the slot early silently exceeded configured concurrency. Transport must honor cancellation.
- Virtualizer still rebuilds prefix measurements in O(n) on changed row measurements. A Fenwick/prefix-tree
  redesign could improve very large, frequently measured lists; no practical workload benchmark justifies it yet.
- Observer pooling and globally shared matchMedia registries could reduce duplicate listeners across separate
  callers but change ownership/reentrancy semantics. No pooling rewrite was selected without an app workload.
- Cross-tab storage fallback remains best-effort JSON transport and leader election remains lease coordination,
  not a distributed lock. Neither can promise reliable persistence/exactly-once behavior.
- Media capture, OS notifications, real device geolocation, screen locks and speech engines require platform
  integration validation; fake API tests prove SDK state/cleanup only.

## Migration notes for parent

- MaxBreakpoints was removed; any number of valid scale entries is observed.
- usePolling takes a direct callback or a ref containing a callback. A dynamic target can be expressed as
  usePolling(() => currentCallback.value()) instead of a getter returning another function.
- clear/remove upload calls no longer release transport concurrency slots early.
- No production consumer exists per owner, so these corrections require no compatibility bridge.
