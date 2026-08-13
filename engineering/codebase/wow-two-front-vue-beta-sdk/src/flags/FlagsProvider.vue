<script lang="ts">
import type { FlagClient, FlagErrorListener } from './FlagClient';
import type { FlagProvider } from './FlagProvider';
import type { EvaluationContext } from './FlagTypes';

/** Defines the props for {@link FlagsProvider}. */
export interface FlagsProviderProps {
  /** An existing client to serve — the app-wide instance shared with non-Vue callers. Takes precedence over `provider` / `onError`. */
  client?: FlagClient;

  /** The flag source to build a client around, when no `client` is passed. Read once, at setup. */
  provider?: FlagProvider;

  /** The evaluation context. Kept in sync on every change — a fresh object literal per render is safe. */
  context?: EvaluationContext;

  /** Receives evaluation faults, when no `client` is passed. Read once, at setup. */
  onError?: FlagErrorListener;
}
</script>

<script setup lang="ts">
import { watch } from 'vue';

import { createFlagClient } from './FlagClient';
import { provideFlags } from './FlagsContext';

/**
 * Provides flag evaluation to every descendant and re-evaluates them whenever the evaluation context
 * changes — including changes made imperatively through `client.setContext(…)` outside Vue.
 *
 * ```vue
 * <FlagsProvider :client="flags" :context="{ targetingKey: user.id, plan: user.plan }">
 *   <App />
 * </FlagsProvider>
 * ```
 *
 * Renders no element of its own — the slot passes straight through, matching `DirectionProvider`.
 */
defineOptions({ name: 'FlagsProvider' });

const props = defineProps<FlagsProviderProps>();

// `setup` runs exactly once per instance, which is precisely what React's lazy `useState`
// initializer was working around — the client must be created once for the component's life, and a
// `computed` would be allowed to drop and re-run it.
const ownClient = props.client ?? createFlagClient({ provider: props.provider, context: props.context, onError: props.onError });

// A getter, not a snapshot: a swapped `client` prop re-subscribes and reaches every consumer.
provideFlags(() => props.client ?? ownClient);

// The `context` prop syncs in through a watcher rather than at construction, so a fresh object
// literal per render is safe: `setContext` no-ops when the merge changes nothing, so a parent that
// rebuilds its context literal every render neither refetches nor re-evaluates flag consumers.
//
// `immediate` lands the context during setup, BEFORE descendants first evaluate — where React's
// effect ran after mount, so a passed-in `client` briefly evaluated against a stale targeting
// context and every gated element could flash. SSR-safe: `setContext` touches no browser global.
watch(
  [() => props.client ?? ownClient, () => props.context],
  ([client, context]) => {
    if (context !== undefined) client.setContext(context);
  },
  { immediate: true },
);
</script>

<template>
  <slot />
</template>
