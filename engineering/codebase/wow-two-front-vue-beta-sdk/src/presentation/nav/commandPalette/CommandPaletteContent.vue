<script lang="ts">
/**
 * The prop surface of `CommandPaletteContent`.
 *
 * React declared `HTMLAttributes<HTMLDivElement>`; attributes reach `ModalContent`
 * through `useAttrs` here, which leaves no declared prop.
 */
export type CommandPaletteContentProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cn } from '../../../foundation/utils';
import { ModalContent } from '../../overlays/modal';

/** The modal panel the palette lives in — full-bleed, no gap, no padding. */
defineOptions({ name: 'CommandPaletteContent', inheritAttrs: false });

/** The palette parts — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();

const classes = computed(() => cn('w-full max-w-xl gap-0 overflow-hidden p-0', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});
</script>

<template>
  <ModalContent v-bind="rest" :class="classes"><slot /></ModalContent>
</template>
