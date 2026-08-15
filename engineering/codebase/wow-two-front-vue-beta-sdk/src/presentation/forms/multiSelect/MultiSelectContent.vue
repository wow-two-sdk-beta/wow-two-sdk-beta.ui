<script lang="ts">
import type {
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/utils';

/**
 * Represents the prop surface of `MultiSelectContent`.
 *
 * React declared the surface axes by `extends SurfaceVariants`; they are spelled out here
 * because the SFC compiler's type resolver cannot follow a `VariantProps<typeof …>` base and
 * fails the build on it. The aliases below are the canonical ones from `foundation/utils`,
 * already locked against the `surfaceVariants` config there, so the two cannot drift.
 */
export interface MultiSelectContentProps {
  /** The visual recipe. */
  variant?: SurfaceVariant;

  /** The color tone the recipe is tinted with. */
  tone?: SurfaceTone;

  /** The corner rounding. */
  radius?: SurfaceRadius;

  /** The inner spacing step. Defaults to `none`. */
  padding?: SurfacePadding;

  /** The shadow depth. */
  elevation?: SurfaceElevation;
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { PopoverContent } from '../../overlays';
import { Listbox } from '../listbox';
import { useMultiSelectContext } from './MultiSelectContext';

/** The anchored panel hosting the multi-select `Listbox`. */
defineOptions({ name: 'MultiSelectContent', inheritAttrs: false });

/** The `MultiSelectItem` rows — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<MultiSelectContentProps>();

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useMultiSelectContext();

const resolvedPadding = computed(() => props.padding ?? 'none');

const panelClass = computed(() => cn('w-auto min-w-[var(--anchor-width)] overflow-hidden', attrs.class as ClassValue));

const selected = computed(() => ctx.values);

function onValueChange(next: unknown): void {
  ctx.setValues(next as ReadonlyArray<string>);
}
</script>

<template>
  <PopoverContent
    :variant="variant"
    :tone="tone"
    :radius="radius"
    :padding="resolvedPadding"
    :elevation="elevation"
    :class="panelClass"
  >
    <Listbox is-multiple :value="selected" variant="flat" radius="none" @value-change="onValueChange">
      <slot />
    </Listbox>
  </PopoverContent>
</template>
