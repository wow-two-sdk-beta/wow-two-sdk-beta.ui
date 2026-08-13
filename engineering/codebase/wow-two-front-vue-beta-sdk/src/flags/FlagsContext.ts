import {
  computed,
  inject,
  provide,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';

import { createFlagClient, type FlagClient } from './FlagClient';
import type { FlagValue } from './FlagTypes';

/*
 * The Vue seam over `FlagClient` — the provide/inject + composable pattern used by
 * `foundation/primitives`' `DirectionProvider`, including its standalone fallback: `useFlag` works
 * with no provider mounted (every flag returns the caller's default), so an SDK component may read
 * a flag without forcing every consuming app to wire one.
 *
 * NOTE ON NAMING: `FlagsProvider` (plural) is the Vue component in `FlagsProvider.vue`;
 * `FlagProvider` (singular, `FlagProvider.ts`) is the backend adapter it evaluates against. Same
 * split as OpenFeature.
 *
 * RE-EVALUATION ON CONTEXT CHANGE. The client is created once and never re-created — swapping it
 * mid-life would drop its subscribers — so a context change cannot propagate by client identity.
 * Instead the provider subscribes to the client and bumps a `revision` ref; every `useFlag` computed
 * reads that ref, so a context change invalidates all of them at once. Evaluation is a synchronous
 * map lookup, so the computed re-evaluates on read with no extra bookkeeping, and never goes stale.
 *
 * WHERE THIS BEATS THE REACT ORIGINAL. React re-rendered every consumer of the context on every
 * revision bump, because the context VALUE carried the revision. Here the revision is a ref read
 * inside each `useFlag` computed, so only the flags actually read are re-evaluated, and only the
 * components that depend on a CHANGED flag re-render — Vue's dependency graph does the narrowing
 * that React's context could not.
 */

/** The active client plus the counter that re-evaluates consumers when the evaluation context moves. */
interface FlagsContextValue {
  /** The client in force. A computed, so a swapped `client` prop still reaches every consumer. */
  readonly client: ComputedRef<FlagClient>;

  /** Bumped on every context change — what invalidates each `useFlag` computed. */
  readonly revision: Ref<number>;
}

/**
 * React's `createContext<FlagsContextValue | undefined>(undefined)` becomes an `InjectionKey` plus
 * the standalone fallback resolved at the injection site. Deliberately NOT re-exported from
 * `index.ts`: the React original kept its context module-private, and the barrel shape is preserved.
 */
const FlagsKey: InjectionKey<FlagsContextValue> = Symbol('wow-two.flags');

/**
 * Backs the composables when no `FlagsProvider` is mounted — an empty static provider, so every flag
 * returns the caller's default. Built lazily and memoised rather than at module scope, so merely
 * importing this module allocates nothing; `revision` never bumps, because nothing can move it.
 */
let standalone: FlagsContextValue | undefined;

function standaloneContext(): FlagsContextValue {
  if (!standalone) {
    const client = createFlagClient();
    standalone = { client: computed(() => client), revision: ref(0) };
  }
  return standalone;
}

/**
 * The provider half — used by `FlagsProvider`, and by any component that owns a flag client.
 * Subscribes to the client and re-subscribes if the active client is swapped, disposing the previous
 * subscription through the watcher's `onCleanup`.
 *
 * Pass `client` as a getter (`() => props.client ?? ownClient`) so the active client stays tracked.
 */
export function provideFlags(client: MaybeRefOrGetter<FlagClient>): void {
  const active = computed(() => toValue(client));
  const revision = ref(0);

  // React bumped a `revision` into component state from an effect; the Vue equivalent is a watcher
  // that owns the subscription. `immediate` is safe under SSR — `subscribe` only adds to a Set and
  // touches no browser global.
  watch(
    active,
    (current, _previous, onCleanup) => {
      onCleanup(current.subscribe(() => (revision.value += 1)));
    },
    { immediate: true },
  );

  provide(FlagsKey, { client: active, revision });
}

/** Resolves the surrounding flags context, or the standalone fallback when no provider is mounted. */
function resolveFlags(): FlagsContextValue {
  return inject(FlagsKey, standaloneContext, true);
}

/**
 * Reads the flag client. Works without a {@link FlagsProvider} — falls back to an empty one, where
 * every flag returns the caller's default.
 *
 * Returns the plain `FlagClient` rather than a ref, matching the React original: the client is
 * created once and never re-created, so there is nothing to track. Use it for imperative reads and
 * for `setContext`; for a value that must re-evaluate when the evaluation context moves, use
 * {@link useFlag}, whose computed is the reactive path.
 */
export function useFlags(): FlagClient {
  return resolveFlags().client.value;
}

/**
 * Reads one flag's value, re-evaluating whenever the evaluation context changes. The typed path is
 * picked from `defaultValue`, which also types the result — `useFlag('newNav', false)` is
 * `ComputedRef<boolean>`, `useFlag('limits', { max: 10 })` is a computed of that object type.
 *
 * Diverges from the React original, which returned a bare `TValue` re-read on every render: this
 * returns a `ComputedRef<TValue>`, because a bare value could never re-evaluate. `key` and
 * `defaultValue` may each be a ref or getter — changing either re-evaluates the flag, which the
 * React signature could not express at all.
 */
export function useFlag<TValue extends FlagValue>(
  key: MaybeRefOrGetter<string>,
  defaultValue: MaybeRefOrGetter<TValue>,
): ComputedRef<TValue> {
  const { client, revision } = resolveFlags();
  return computed<TValue>(() => {
    // `revision` is the dependency that re-evaluates this flag when the evaluation context moves.
    // Read through `void` rather than discarded into a binding — the read IS the subscription.
    void revision.value;
    return client.value.getValue(toValue(key), toValue(defaultValue));
  });
}
