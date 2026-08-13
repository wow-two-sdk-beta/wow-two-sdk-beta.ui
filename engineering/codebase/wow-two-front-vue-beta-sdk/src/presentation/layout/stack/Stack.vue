<script lang="ts">
import type { ElementType } from '../../../foundation/utils';
import type {
  StackVariants,
  StackDirection,
  StackAlign,
  StackJustify,
  StackWrap,
} from './Stack.variants';

/**
 * The gap between children. Spelled out rather than derived from
 * `StackVariants['gap']` because `defineProps<T>()` needs a type the SFC
 * compiler can resolve to a runtime declaration, and `VariantProps<typeof …>`
 * is opaque to it. The `AssertExact` lock below pins it to the variant keys, so
 * the duplication cannot drift.
 */
export type StackGap = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';

export interface StackProps {
  as?: ElementType;
  /** The flex main-axis direction. Default `column`. */
  direction?: StackDirection;
  /** The cross-axis alignment of children. */
  align?: StackAlign;
  /** The main-axis distribution of children. */
  justify?: StackJustify;
  /** The child wrapping onto multiple lines. */
  wrap?: StackWrap;
  /** The gap between children (Tailwind spacing step). Default `4`. */
  gap?: StackGap;
}

/* Compile-time lock: the hand-written `gap` union ≡ the tv variant keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertStackGap: AssertExact<StackGap, NonNullable<StackVariants['gap']>> = true;
void _assertStackGap;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { stackVariants } from './Stack.variants';

/**
 * Vertical (default) or horizontal flex container with gap and alignment
 * variants. For row preset use `HStack`, for column use `VStack`.
 *
 * Only `as` carries a default — `direction` / `align` / `justify` / `gap` /
 * `wrap` stay `undefined` so `stackVariants`' own `defaultVariants` decide,
 * exactly as in the React original.
 */
defineOptions({ name: 'Stack', inheritAttrs: false });

const props = withDefaults(defineProps<StackProps>(), { as: 'div' });

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const classes = computed(() =>
  cn(
    stackVariants({
      direction: props.direction,
      align: props.align,
      justify: props.justify,
      gap: props.gap,
      wrap: props.wrap,
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
  <component :is="props.as" ref="el" v-bind="rest" :class="classes"><slot /></component>
</template>
