<script lang="ts">
import type { AuthBridge } from './AuthBridge';
import { AuthStatus, type AuthSession, type AuthStrategy } from './AuthSession';

const AnonymousSession = { status: AuthStatus.Anonymous, user: null } as const;

/** Defines the props for {@link AuthProvider}. */
export interface AuthProviderProps<TUser = unknown, TSignInInput = unknown> {
  /** The transport strategy (cookie / bearer / redirect factory, or bespoke delegates). Read live on every call, so swapping it takes effect immediately — it does not re-resolve on its own. */
  strategy: AuthStrategy<TUser, TSignInInput>;

  /** The module-scope bridge wiring the non-Vue seams — api-client 401s flip this session; router guards read it. */
  bridge?: AuthBridge<TUser>;

  /** Whether to run the me-resolve on mount. Default `true`; with `false` the session stays `unknown` until `refresh()` or an action settles it. */
  resolveOnMount?: boolean;

  /** Fires after a bridged 401 flips the session to `anonymous` — wire redirect-to-login here. */
  onUnauthorized?: (error?: unknown) => void;

  /** Fires when the me-resolve throws (network / 5xx) — the session still settles `anonymous`. */
  onResolveError?: (error: unknown) => void;

  /** Fires on every session snapshot, including the initial `unknown`. */
  onSessionChange?: (session: AuthSession<TUser>) => void;
}
</script>

<script setup lang="ts" generic="TUser = unknown, TSignInInput = unknown">
import { onMounted, provide, shallowRef, watch } from 'vue';

// `AuthStatus` / `AuthSession` are already imported by the plain `<script>` block above — the two
// blocks compile into ONE module, so importing them again here is a duplicate identifier.
import { AuthKey, type AuthApi } from './AuthContext';

/**
 * Owns the app session state machine (`unknown → resolving → authenticated | anonymous`) —
 * me-resolve on mount (deduped, never aborted mid-flight), `signIn`/`signOut`/`refresh`/`setUser`
 * actions, and optional `AuthBridge` wiring so api-client 401s flip the session and router guards
 * can await it. Headless: gates, splash screens, and login UI stay app-side.
 *
 * ```vue
 * <AuthProvider :strategy="strategy" :bridge="bridge">
 *   <App />
 * </AuthProvider>
 * ```
 *
 * Renders no element of its own — the slot passes straight through.
 */
defineOptions({ name: 'AuthProvider' });

const props = withDefaults(defineProps<AuthProviderProps<TUser, TSignInInput>>(), {
  bridge: undefined,
  resolveOnMount: true,
  onUnauthorized: undefined,
  onResolveError: undefined,
  onSessionChange: undefined,
});

const session = shallowRef<AuthSession<TUser>>({ status: AuthStatus.Unknown, user: null });

// React needed the latest-ref pattern here — four `useRef`s reassigned every render — so its
// `useCallback` delegates could read fresh props without re-creating. Vue's `props` is already a
// live reactive object, so reading `props.strategy` / `props.onResolveError` at call time IS the
// latest-ref pattern, and the whole bookkeeping block collapses to nothing.

// Guards async completions: every explicit transition bumps the generation, so a stale resolve
// settling later cannot overwrite it. Plain locals — never rendered, so reactivity would be waste.
let generation = 0;
let inflight: Promise<TUser | null> | null = null;

// Publish every snapshot outward — bridge first (guards may be awaiting), then the app callback.
// `immediate` publishes the initial `unknown`, which React's mount effect also did. SSR-safe: both
// sinks are plain callbacks over a Set, with no browser global in reach.
watch(
  [session, () => props.bridge],
  ([current, bridge]) => {
    bridge?.publishSession(current);
    props.onSessionChange?.(current);
  },
  { immediate: true },
);

function runResolve(): Promise<TUser | null> {
  // Shared in-flight promise: a remount and concurrent `refresh()` calls ride one me-request
  // instead of racing duplicates (the drydock dedupe, per-provider).
  if (inflight) return inflight;

  const current = ++generation;
  session.value = { status: AuthStatus.Resolving, user: null };

  const promise = (async (): Promise<TUser | null> => {
    let user: TUser | null;
    try {
      user = await props.strategy.resolveUser({});
    } catch (error) {
      user = null;
      props.onResolveError?.(error);
    }
    if (generation === current) {
      session.value = user == null ? AnonymousSession : { status: AuthStatus.Authenticated, user };
    }
    return user;
  })().finally(() => {
    if (inflight === promise) inflight = null;
  });

  inflight = promise;
  return promise;
}

// `onMounted` never runs on the server, which is exactly what the me-resolve needs: it is a network
// call, and a `watch(…, { immediate: true })` here would fire it during SSR.
onMounted(() => {
  if (props.resolveOnMount) void runResolve();
});

// React's mount effect also re-ran when `resolveOnMount` flipped; a non-immediate watcher mirrors
// that, and cannot double-fire at mount the way an immediate one would.
watch(
  () => props.resolveOnMount,
  (enabled) => {
    if (enabled) void runResolve();
  },
);

// Bridged 401 → strategy cleanup (bearer drops its token) → anonymous → app callback.
watch(
  () => props.bridge,
  (bridge, _previous, onCleanup) => {
    if (!bridge) return;
    onCleanup(
      bridge.subscribeUnauthorized((error) => {
        props.strategy.onUnauthorized?.();
        generation += 1;
        inflight = null;
        session.value = AnonymousSession;
        props.onUnauthorized?.(error);
      }),
    );
  },
  { immediate: true },
);

async function signIn(input?: TSignInInput): Promise<TUser | null> {
  const doSignIn = props.strategy.signIn;
  if (!doSignIn) throw new Error('AuthProvider: the configured strategy does not implement signIn.');
  const user = (await doSignIn(input as TSignInInput, {})) ?? null;
  if (user === null) return null; // no user handed back (redirect navigating away) → state unchanged
  generation += 1;
  inflight = null;
  session.value = { status: AuthStatus.Authenticated, user };
  return user;
}

async function signOut(): Promise<void> {
  generation += 1;
  inflight = null;
  try {
    await props.strategy.signOut?.({});
  } finally {
    session.value = AnonymousSession; // local sign-out always lands, even when the server call fails
  }
}

function setUser(user: TUser | null): void {
  generation += 1;
  inflight = null;
  session.value = user == null ? AnonymousSession : { status: AuthStatus.Authenticated, user };
}

// React rebuilt this object through `useMemo` on every session change so consumers saw fresh
// values. Native getters over the `session` ref do it without rebuilding: each read tracks the ref,
// so a template binding or a `computed` re-evaluates on transition. See `AuthApi` for why these are
// getters rather than a `reactive()` wrapper — a proxy would break `user`'s identity.
const api: AuthApi<TUser, TSignInInput> = {
  get status() {
    return session.value.status;
  },
  get user() {
    return session.value.user;
  },
  get isAuthenticated() {
    return session.value.status === AuthStatus.Authenticated;
  },
  get isPending() {
    return session.value.status === AuthStatus.Unknown || session.value.status === AuthStatus.Resolving;
  },
  signIn,
  signOut,
  refresh: runResolve,
  setUser,
};

provide(AuthKey, api as AuthApi<unknown, unknown>);
</script>

<template>
  <slot />
</template>
