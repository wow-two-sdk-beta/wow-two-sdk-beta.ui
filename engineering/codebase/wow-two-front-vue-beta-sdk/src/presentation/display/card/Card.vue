<script lang="ts">
import type {
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/utils';

/**
 * Represents the prop surface of `Card`.
 *
 * React declared these by `extends SurfaceVariants`; spelled out here because
 * `defineProps<T>()` needs a type the SFC compiler can resolve to a runtime
 * declaration, and `VariantProps<typeof surfaceVariants>` is opaque to it.
 */
export interface CardProps {
  /** The visual recipe — solid · soft · surface · outline · glass · elevated · flat · subtle. */
  variant?: SurfaceVariant;
  /** The color tone the recipe is tinted with. */
  tone?: SurfaceTone;
  /** The corner rounding. */
  radius?: SurfaceRadius;
  /** The inner spacing step. */
  padding?: SurfacePadding;
  /** The shadow depth. */
  elevation?: SurfaceElevation;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/utils';

/**
 * Raised surface for grouped content. The sub-components ship as siblings —
 * `CardHeader` / `CardTitle` / `CardDescription` / `CardBody` / `CardFooter` —
 * rather than statics on this component, since an SFC's default export cannot
 * carry them cleanly.
 */
defineOptions({ name: 'Card', inheritAttrs: false });

/** The card content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<CardProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(
    surfaceVariants({
      variant: props.variant ?? 'surface',
      tone: props.tone,
      radius: props.radius ?? 'lg',
      padding: props.padding ?? 'none',
      elevation: props.elevation ?? 1,
    }),
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div ref="el" v-bind="rest" :class="classes"><slot /></div>
</template>
