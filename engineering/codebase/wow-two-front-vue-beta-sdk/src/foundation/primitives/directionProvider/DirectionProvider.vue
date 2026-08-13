<script lang="ts">
import type { Direction } from './DirectionContext';

export interface DirectionProviderProps {
  dir: Direction;
}
</script>

<script setup lang="ts">
import { provideDirection } from './DirectionContext';

/**
 * Provide reading direction to descendants. Components that mirror in RTL
 * (Tabs arrow keys, Slider, Carousel, etc.) read this via `useDirection()`.
 *
 * Renders no element of its own — the slot passes straight through.
 */
defineOptions({ name: 'DirectionProvider' });

const props = defineProps<DirectionProviderProps>();

provideDirection(() => props.dir);
</script>

<template>
  <slot />
</template>
