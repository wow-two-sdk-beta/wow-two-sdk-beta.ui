<script lang="ts">
import type { NavigationProgressState } from './UseNavigationProgress';

/** Defines the props for {@link ProgressProvider}. */
export interface ProgressProviderProps {
  /** An externally created state to provide (from `createNavigationProgress()`); a fresh one when omitted. */
  state?: NavigationProgressState;
}
</script>

<script setup lang="ts">
// `NavigationProgressState` is already imported by the plain `<script>` block above — the two
// blocks compile into ONE module, so importing it again here is a duplicate identifier.
import { provideNavigationProgress } from './UseNavigationProgress';

/**
 * Provides the navigation-progress state to its subtree — ref-counts manual busy spans that
 * `<NavigationProgress mode="manual">` (and `QueryProgressBridge`) drive.
 *
 * ```vue
 * <ProgressProvider>
 *   <App />
 * </ProgressProvider>
 * ```
 *
 * Renders no element of its own — the slot passes straight through.
 */
defineOptions({ name: 'ProgressProvider' });

defineSlots<{
  /** The subtree that can drive and observe the shared manual busy state. */
  default(): unknown;
}>();

const props = withDefaults(defineProps<ProgressProviderProps>(), { state: undefined });

provideNavigationProgress(props.state);
</script>

<template>
  <slot />
</template>
