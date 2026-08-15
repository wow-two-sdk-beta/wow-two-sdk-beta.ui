<script lang="ts">
/**
 * The prop surface of `ScrollSpy`.
 *
 * React declared `extends UseScrollSpyOptions`; that interface carries
 * `MaybeRefOrGetter` fields here (the house composable contract), which a prop
 * cannot hold, so the plain-value mirror is spelled out instead.
 */
export interface ScrollSpyProps {
  ids: ReadonlyArray<string>;
  rootMargin?: string;
  threshold?: number | number[];
  /** Element to observe within. Defaults to viewport. */
  root?: Element | Document | null;
}
</script>

<script setup lang="ts">
import { watch } from 'vue';
import { useScrollSpy } from './UseScrollSpy';

/**
 * Scoped-slot variant of `useScrollSpy`. Emits `activeId` via `active-change`
 * or the default slot. Renders nothing by default.
 */
defineOptions({ name: 'ScrollSpy' });

defineSlots<{
  /** React's render-prop `children` — receives the currently-active section id. */
  default?(props: { activeId: string | null }): unknown;
}>();

const props = defineProps<ScrollSpyProps>();

const emit = defineEmits<{
  /** Replaces React's `onActiveChange`. Fires once on mount with the initial value, as the effect did. */
  'active-change': [id: string | null];
}>();

const activeId = useScrollSpy(() => props.ids, {
  rootMargin: () => props.rootMargin,
  threshold: () => props.threshold,
  root: () => props.root,
});

watch(activeId, (id) => emit('active-change', id), { immediate: true, flush: 'post' });
</script>

<template>
  <slot v-bind="{ activeId }" />
</template>
