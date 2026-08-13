<script lang="ts">
import type { ToggleButtonGroupProps } from '../toggleButtonGroup';

export type SegmentedControlProps<T extends string = string> = Omit<
  ToggleButtonGroupProps<T>,
  'variant'
>;
</script>

<script setup lang="ts" generic="T extends string = string">
import ToggleButtonGroup from '../toggleButtonGroup/ToggleButtonGroup.vue';
import { ToggleButtonGroupVariant } from '../toggleButtonGroup';

/**
 * iOS-style connected pill row.
 *
 * @deprecated Use `ToggleButtonGroup variant="segmented"` — this is now a thin alias that
 * forwards to it. Kept for back-compat; will be removed in a future beta.
 */
defineOptions({ name: 'SegmentedControl' });

/* Explicit `undefined` defaults keep Vue's boolean casting from turning these absent props into
   `false` — they are forwarded verbatim, so `false` would override `ToggleButtonGroup`'s own
   defaults instead of deferring to them. */
const props = withDefaults(defineProps<SegmentedControlProps<T>>(), {
  isAttached: undefined,
  equalWidth: undefined,
});

const emit = defineEmits<{
  /** Emits the selection whenever it changes — forwarded verbatim from `ToggleButtonGroup`. */
  'value-change': [value: T | null | ReadonlyArray<string>];
}>();
</script>

<template>
  <ToggleButtonGroup
    v-bind="props"
    :variant="ToggleButtonGroupVariant.Segmented"
    @value-change="(value: T | null | ReadonlyArray<string>) => emit('value-change', value)"
  >
    <slot />
  </ToggleButtonGroup>
</template>
