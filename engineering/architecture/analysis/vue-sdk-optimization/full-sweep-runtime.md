> Lane evidence. The [combined implementation report](full-sweep-implementation.md) owns final package verification.

# Vue integration implementation

## Completed integration lane

Implemented A01/A02/A03/A09/A10/A18/A20. No index operations or commits performed.

- New public `foundation/http/RequestScope.ts`: isolated capture/invalidate/dispose lifetime, prompt cancellation even when delegates ignore signals.
- `createApiClient({ scope })` captures origin before token resolution and retries; resolves credentials once; suppresses old unauthorized callbacks. Malformed unsuccessful diagnostics preserve HTTP/retry classification; programmer codecs still throw.
- `client.detailed.{get,post,put,patch,delete,request}` preserves decoded payload type plus status, immutable response headers and URL. Positive and negative inference tests cover empty/text/blob/arrayBuffer/JSON.
- `createAuthBridge({ getIdentity })` exposes scope and provider ownership leases. Stable identity refresh preserves the scope; identity switches/logout invalidate once. Provider disposal clears authenticated state and resolves pending guards false. Old leases cannot affect new owners.
- Wire both `scope: bridge.scope` and `onUnauthorized: bridge.onUnauthorized` into HTTP. A callback alone cannot identify the request's originating session.
- `createQueryClient({ scope })` adds `invalidateSession()`/`dispose()`. Mutations capture before scheduling; late confirmations, stale optimistic rollback and queued old writes are blocked. Live query observers rebind; page placeholders do not carry old identities. Ordinary vendor `clear()` remains cache-only.
- Persistence removes its own saved snapshot and unsubscribes at the identity boundary. Set persistence up explicitly for the next identity. Old handles cannot erase a new storage-key owner.
- Google owner API: call `provideGoogleIdentity(options)` once in ancestor setup; `useGoogleIdentity()` only injects. Button props now contain appearance only; client ID, auto-select, error and credential callbacks belong to owner. Multiple buttons initialize once; competing document owners fail explicitly. Minimal existing gallery fixture wrapped with unconfigured provider.
- Route announcer focuses after routed DOM updates, guards superseded/disposed announcements, and clears repeated titles before announcement.

## Verification

- `pnpm exec vitest run --project unit tests/unit/foundation/http tests/unit/auth/auth.test.ts tests/unit/auth/Strategies.test.ts tests/unit/query/QueryOutcome.test.ts`: 6 files, 51 passed.
- `pnpm exec vitest run --project dom tests/unit/auth tests/unit/query tests/unit/router tests/unit/foundation/oauth tests/unit/presentation/actions/GoogleSignInButton.dom.test.ts`: 12 files, 41 passed.
- Package vue-tsc executed: no errors in owned integration sources/tests. Errors in concurrently edited presentation forms and Localization test notified to parent. Parent owns final whole-package gates.
- Scoped formatting applied. Focused specs added beside HTTP/auth/query/OAuth and updated existing button/announcer specs.

## Registration / migration for parent

New source files: `src/foundation/http/RequestScope.ts` (public via http barrel) and `src/query/adapters/tanstack/QueryLifetime.ts` (internal). If capability checker has source manifests, register them there.
Auth barrel adds AuthBridgeOptions and AuthBridgeOwner types. HTTP export-star publishes response metadata types. OAuth barrel replaces UseGoogleIdentityOptions with ProvideGoogleIdentityOptions.

App integration:

```ts
const bridge = createAuthBridge<User>({ getIdentity: user => `${user.tenantId}:${user.id}` });
const api = createApiClient({ scope: bridge.scope, onUnauthorized: bridge.onUnauthorized });
const queryClient = createQueryClient({ scope: bridge.scope });
// AuthProvider receives bridge; app teardown calls queryClient.dispose().
```

Browser native prompts and remote effects cannot be revoked by cancelling the caller's wait. Google script configuration remains inherently document-global, explicitly owned and rejected when competing; no SSR app shares implicit auth/query state.

## Expanded foundation lane

Completed implementation-level review across all 22 assigned runtime foundations. Reviewed lifecycle, cancellation, platform access and callback ownership; declarations and barrels were checked for the touched contracts. No broad demo changes. No claim that mocked/native tests establish real browser permissions, devices or network behavior.

| Capability | Review outcome |
|---|---|
| animation | Reviewed animation fallback, FLIP/layout measurement and transition cleanup; no additional justified edit. |
| async | Retry now settles cancellation promptly even when a running delegate ignores its signal. |
| channels | Storage transport uses each event's own payload; key changes reset broadcast state synchronously; channels remain mount-owned; reset closes memory endpoints. |
| clipboard | Reviewed API/fallback/read/paste and composable async generations; no additional justified edit. |
| device | Reviewed browser probes, media queries, breakpoint subscription changes; no additional justified edit. |
| geolocation | Reviewed position conversion, one-shot/watch ownership and distance calculation; no additional justified edit. |
| gestures | Active drag/hold/pinch listeners tear down when disabled changes; secondary-button starts are ignored. |
| history | Clearing within a transaction drops its buffered entries, preventing later resurrection. |
| idb | Transaction completion rejection is observed immediately while an async delegate remains pending. |
| media | Reviewed capture, device enumeration, facing mode and stale stream cleanup; no additional justified edit. |
| net | Socket/SSE/poller observers cannot interrupt scheduling; SSE parser failures reach the error seam. Coordinated preservation of explicit infinite reconnect budgets with resilience owner. |
| notifications | A permission subscriber that stops during its first notification cannot attach a leaked change listener. |
| observers | Queued callbacks ignore disposed observers and removed/replaced targets. |
| screen | Wake lock tracks platform release, releases late hidden/disposed acquisitions, detaches platform listeners. Added subscribeRelease to WakeLockHandle. |
| selection | Only own registered accessor keys are invoked; prototype names use normal row-property lookup. |
| share | Reviewed support detection, native result classification and ownership; no additional justified edit. |
| shortcuts | Escape/hotkey/map handlers ignore IME composition; Escape checks current enabled value. |
| speech | Unknown recognition codes cannot resolve through object prototypes; fallback voice listener disposal preserves later subscribers. |
| storage | Reviewed brokers, namespace/versioned state and persistent/recent hooks; no additional justified edit. Generic persisted values remain caller-typed JSON. |
| uploads | Attempt-tagged progress drops stale callbacks; subscriber errors cannot strand the queue; retry/setup failures become item failures; XHR send throw releases abort listener. Existing transport-settlement concurrency semantics preserved. |
| virtualization | Retained sizes follow stable item keys after reordering; axis change clears old measurements. |
| workers | Disposed host suppresses late replies, closed reply channel failures stay observed; Vue worker construction errors reach onError. |

### Expanded regression evidence

New tests: `tests/unit/foundation/browser/RuntimeLifetimes.test.ts` (18), `RuntimeLifetimes.dom.test.ts` (11). SessionBoundary gains a sixth case proving owner-scope disposal cannot be revived through invalidateSession.

Executed focused command, **9 files / 90 passing**:

```sh
pnpm exec vitest run --project unit tests/unit/foundation/browser/RuntimeLifetimes.test.ts tests/unit/foundation/async tests/unit/foundation/history tests/unit/foundation/browser/Optimization.test.ts tests/unit/foundation/browser/BrowserOperations.test.ts --project dom tests/unit/foundation/browser/RuntimeLifetimes.dom.test.ts tests/unit/foundation/browser/Optimization.dom.test.ts tests/unit/query/SessionBoundary.dom.test.ts
```

This overlaps the earlier integration tests; do not sum the counts as distinct tests. Scope-lifetime additions, formatter/lint cleanup and full integration validation are also covered above.

- Scoped ESLint over integration + modified foundations + added tests: exit 0 with `--max-warnings 0`; `/private/tmp/vue-integration-lint.log` empty.
- Scoped Prettier executed; `git diff --check` passed over owned source/tests.
- Latest package vue-tsc: no owned errors. Other concurrent lanes had DiffViewer DiffRow, ArrayIdentity getFieldState and InteractionSafety focus type errors; parent notified. Parent owns final whole-package checks.
- New contract specs beside channels, net, uploads, virtualization and wake lock.
- Expanded lane adds no new `.ts` source files or barrel registrations; only integration RequestScope and QueryLifetime need the parent registration review mentioned above.

The initial runtime test snapshot caught a partial RetryPolicy fixture and the parallel resilience maxRetries change. Fixture corrected; real reconnect integration regression fixed by resilience owner. Final focused run is green. No staging or commits performed.

## Final DOM/primitives closure pass

Parent delegated the remaining shared DOM/primitives implementations after the runtime pass. Reviewed actual DOM event/order/URL/data/polymorphic helpers, event/outside-click/focus-trap/scroll-lock hooks, and all primitives except FocusScope (owned by the UI lane): accessibleIcon, anchoredPositioner, announce, collection, colorModeProvider, directionProvider, dismissableLayer, formControlContext, overlayArrow, portal, presence, rovingFocusGroup, scrollLockProvider, scrollViewport, slot and visuallyHidden. Parent-owned Presence/Primitive/Slot/ScrollLock fixes were inspected and preserved.

Three additional concrete fixes:

1. `DismissableLayer.vue`: IME Escape cannot dismiss the active layer.
2. `RovingFocusContext.ts`: an active disabled item cannot reclaim the group's sole tab stop during initial selection or focusout. Uses the group's owner document for current focus.
3. `ColorModeProvider.vue`: document-root style ownership now survives nested and independent providers. Child providers win over ancestors despite child-first mounting; later independent owners win. Removing a provider reveals the next owner; final removal restores original dark class and color-scheme value/priority. All SSR provider state stays independent; document-root ownership is WeakMap-scoped and starts only on mount.

A suspected forwarded-attrs caching defect in Announce was **disproved** by a passing dynamic class/data-attribute test; no source change applied there.

Verification:

- New `tests/unit/foundation/primitives/Ownership.dom.test.ts`: 5 cases passed.
- Existing `RovingFocus.dom.test.ts`: 2 cases passed.
- Existing `ColorMode.ssr.test.ts`, explicitly run under `--project ssr`: 1 case passed.
- Scoped ESLint over three sources + new test: exit 0, `--max-warnings 0`.
- New ColorModeProvider contract spec; DismissableLayer spec updated.
- No new source exports, index operations, commits, or demo changes from this closure pass.

Latest closure checks: after correcting two type-only test fixtures, Ownership DOM tests reran 5/5. Final package vue-tsc had no owned-lane errors; sole concurrent diagnostic was `presentation/display/stepperGroup/StepperGroupStep.vue:46` expecting two arguments. Scoped diff whitespace check passed again. Parent owns the combined final gate on stable shared state.
