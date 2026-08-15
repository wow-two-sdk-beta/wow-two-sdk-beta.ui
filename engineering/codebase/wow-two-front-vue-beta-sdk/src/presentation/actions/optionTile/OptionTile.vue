<script lang="ts">
import type { ColorTone } from '../../../foundation/utils';
import type { ButtonSize } from '../button/Button.vue';
import type { ToggleButtonProps } from '../toggleButton';

/** Defines props for a single-select preset tile. */
export interface OptionTileProps extends /* @vue-ignore */ Omit<
  ToggleButtonProps,
  'isPressed' | 'defaultPressed' | 'onPressedChange' | 'children' | 'aria-label' | 'title' | 'variant' | 'shape'
> {
  /** The active-selection state of this tile. */
  selected: boolean;

  /** The accessible label + native tooltip — the tile is icon-only, so this is its name. */
  label: string;

  /* Re-declared from `ToggleButtonProps` (identical types) purely so the SFC compiler sees them:
     defaults can only be attached to props it actually generates, and the heritage is ignored. */

  /** The semantic tone palette. Default `primary`. */
  tone?: ColorTone;

  /** The tile size. Default `sm`. */
  size?: ButtonSize;
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, ColorTone as ColorToneValue } from '../../../foundation/utils';
import ToggleButton from '../toggleButton/ToggleButton.vue';
import { ToggleButtonVariant } from '../toggleButton';
import { ButtonShape } from '../button';
import { optionTileVariants } from './OptionTile.variants';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call; everything else is
   forwarded onto `ToggleButton` by hand. */
defineOptions({ name: 'OptionTile', inheritAttrs: false });

/* `onSelect` became the `select` emit; the React prop was required, which an emit cannot express.
   `children` has no prop counterpart — the tile's icon, glyph, or swatch is the default slot. */
withDefaults(defineProps<OptionTileProps>(), {
  size: 'sm',
  tone: ColorToneValue.Primary,
});

const emit = defineEmits<{
  /** Fires when this tile is selected. Single-select — the parent owns the value, so re-selecting the active tile is a harmless no-op. */
  select: [];
}>();

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() => cn(optionTileVariants(), attrs.class as ClassValue));
</script>

<template>
  <!--
    Renders a square, single-select tile for preset grids (fill types, module /
    finder shapes, gradient presets) — an icon-only `ToggleButton` (`shape="square"`)
    with a soft pressed wash. Compose several in a grid; the parent owns the active
    value. Disable a whole grid by wrapping it in a native `<fieldset disabled>`.
  -->
  <ToggleButton
    :shape="ButtonShape.Square"
    :variant="ToggleButtonVariant.Outline"
    :tone="tone"
    :size="size"
    :is-pressed="selected"
    :aria-label="label"
    :title="label"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @pressed-change="emit('select')"
  >
    <slot />
  </ToggleButton>
</template>
