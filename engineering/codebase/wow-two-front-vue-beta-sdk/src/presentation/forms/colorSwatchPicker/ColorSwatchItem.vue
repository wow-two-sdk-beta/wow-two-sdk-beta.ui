<script lang="ts">
import type { ColorSwatchSize, SwatchShape } from '../colorSwatch';

/**
 * Defines props for the internal `ColorSwatchItem`.
 *
 * `size` / `shape` are the NAMED axis types, not `ColorSwatchVariants['size']` as the React
 * original spelled them — the SFC prop resolver cannot follow an indexed access into an
 * imported interface, and the build fails on it while `vue-tsc` stays green.
 */
export interface ColorSwatchItemProps {
  /** The swatch color. */
  color: string;
  /** The selected state. */
  isSelected: boolean;
  /** The disabled state. */
  isDisabled: boolean;
  /** The swatch size step. */
  size?: ColorSwatchSize;
  /** The swatch outline shape. */
  shape?: SwatchShape;
}
</script>

<script setup lang="ts">
import { useRovingFocusItem } from '../../../foundation/primitives';
import ColorSwatch from '../colorSwatch/ColorSwatch.vue';

/* One roving-focus stop in a `ColorSwatchPicker`. Internal — never exported from the folder. */
defineOptions({ name: 'ColorSwatchItem' });

const props = defineProps<ColorSwatchItemProps>();

const emit = defineEmits<{
  /** Fires when the swatch is clicked or activated with Enter / Space. */
  select: [color: string];
}>();

/* Reactive object — `tabindex` tracks the group's tab stop, so read through it rather than
   destructuring. The function `ref` registers this item's node with the group. */
const roving = useRovingFocusItem();

/* Roving navigation runs first and may `preventDefault()` an arrow key; Enter / Space only
   select when it did not — the React original's exact order. */
function handleKeydown(event: KeyboardEvent): void {
  roving.onKeydown(event);
  if (event.defaultPrevented) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    emit('select', props.color);
  }
}
</script>

<template>
  <ColorSwatch
    :ref="roving.ref"
    :color="color"
    :size="size"
    :shape="shape"
    :is-selected="isSelected"
    :is-disabled="isDisabled"
    :tabindex="roving.tabindex"
    :data-roving-focus-item="roving['data-roving-focus-item']"
    :aria-label="color"
    @click="emit('select', color)"
    @focus="roving.onFocus()"
    @keydown="handleKeydown"
  />
</template>
