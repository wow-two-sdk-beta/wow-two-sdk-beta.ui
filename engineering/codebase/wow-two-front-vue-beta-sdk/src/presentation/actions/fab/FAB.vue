<script lang="ts">
import type { ButtonHTMLAttributes } from 'vue';
import type { OverlayPosition } from '../../../foundation/utils';
import type { FabVariants, FabVariant, FabSize } from './Fab.variants';

/* The required accessible label rides on the ignored heritage rather than the body — Fab content
   is typically icon-only, so the name is mandatory, but it must reach the DOM as an attribute. */
type FabAttributes = ButtonHTMLAttributes & { 'aria-label': string };

/* Both heritage types are `@vue-ignore`d — native button attributes belong in attribute
   fallthrough, and `FabVariants` resolves through `typeof fabVariants`, which the SFC prop
   compiler cannot walk. */
export interface FabProps
  extends /* @vue-ignore */ FabAttributes, /* @vue-ignore */ Omit<FabVariants, 'variant' | 'size' | 'position'> {
  /** The visual surface style. */
  variant?: FabVariant;
  /** The button diameter. */
  size?: FabSize;
  /** The anchor position on the viewport. */
  position?: OverlayPosition;
  /** The button type. Default `ButtonType.Button`. */
  type?: ButtonType;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { ButtonType, cn } from '../../../foundation/utils';
import { fabVariants } from './Fab.variants';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Fab', inheritAttrs: false });

/* `aria-label` is deliberately NOT a declared prop: Vue camelizes prop keys, so a declared
   `'aria-label'` would arrive as `props.ariaLabel` and never render. It stays a fallthrough attr;
   the interface keeps the requirement through the `@vue-ignore`d heritage. */
/* `children` has no prop counterpart — it is the default slot. */
const props = withDefaults(defineProps<FabProps>(), { type: ButtonType.Button });

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(fabVariants({ variant: props.variant, size: props.size, position: props.position }), attrs.class as ClassValue),
);

const root = useTemplateRef<HTMLButtonElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <!-- Floating Action Button — fixed-position circular button with shadow. -->
  <button ref="root" :type="type" :class="rootClass" v-bind="passthroughAttrs">
    <slot />
  </button>
</template>
