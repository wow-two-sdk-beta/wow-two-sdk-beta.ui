<script lang="ts">
import type { QueryClient } from '@tanstack/vue-query';

/** Defines the props for {@link QueryProvider}. */
export interface QueryProviderProps {
  /** The app `QueryClient` (from `createQueryClient`). */
  readonly client: QueryClient;
}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, provide } from 'vue';
// `QueryClient` is already imported as a TYPE by the plain `<script>` block above — the two blocks
// compile into ONE module, so only the injection-key VALUE comes in here.
import { VUE_QUERY_CLIENT } from '@tanstack/vue-query';

/**
 * Renders no element of its own — the slot passes straight through — while mounting the app `QueryClient`
 * above that subtree.
 *
 * `@tanstack/vue-query` ships no `QueryClientProvider` component — it installs as an app plugin
 * (`queryPlugin`). This is the component form, built on the same injection key the library's own
 * `useQueryClient()` reads, so every hook in this module works underneath it. Use it when a SUBTREE
 * (or a test) needs its own client; use `queryPlugin` for the whole app.
 *
 * `client.mount()` runs from `onMounted`, which never executes on the server — the plugin skips it
 * there for the same reason: mounting subscribes the focus / online managers to browser globals.
 */
defineOptions({ name: 'QueryProvider' });

defineSlots<{
  /** The subtree with access to the client. */
  default(): unknown;
}>();

const props = defineProps<QueryProviderProps>();

provide(VUE_QUERY_CLIENT, props.client);

onMounted(() => props.client.mount());
onUnmounted(() => props.client.unmount());
</script>

<template>
  <slot />
</template>
