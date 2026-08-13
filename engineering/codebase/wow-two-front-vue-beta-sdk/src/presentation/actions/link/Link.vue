<script lang="ts">
import type { AnchorHTMLAttributes } from 'vue';
import type { LinkVariants, LinkVariant, LinkSize } from './Link.variants';

/* Both heritage types are `@vue-ignore`d — native anchor attributes belong in attribute
   fallthrough, and `LinkVariants` resolves through `typeof linkVariants`, which the SFC prop
   compiler cannot walk. The type surface is unchanged. */
export interface LinkProps
  extends /* @vue-ignore */ AnchorHTMLAttributes,
    /* @vue-ignore */ Omit<LinkVariants, 'variant' | 'size'> {
  /** The color treatment. */
  variant?: LinkVariant;
  /** The text size. */
  size?: LinkSize;
  /** The as-child flag — when true, renders the child element as the link instead of an `<a>`.
   *  Use for a router `<RouterLink>`. */
  asChild?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type ComponentPublicInstance } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, HtmlElement } from '../../../foundation/utils';
import { Primitive } from '../../../foundation/primitives';
import { linkVariants } from './Link.variants';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
/* `<link>` is a real HTML element, but this is a library component — imported, never globally
   registered — so the name cannot shadow the tag, and renaming it would break parity with the
   React package. `vue/no-reserved-component-names` is off for `src/presentation/**` for exactly
   this reason. */
defineOptions({ name: 'Link', inheritAttrs: false });

const props = withDefaults(defineProps<LinkProps>(), { asChild: false });

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(linkVariants({ variant: props.variant, size: props.size }), attrs.class as ClassValue),
);

const root = useTemplateRef<ComponentPublicInstance>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
const el = computed<HTMLElement | null>(() => {
  const node = root.value?.$el;
  return node instanceof HTMLElement ? node : null;
});

defineExpose({ el });
</script>

<template>
  <!-- Anchor with consistent focus/hover styling — `asChild` swaps in router links. -->
  <Primitive
    ref="root"
    :as="HtmlElement.Anchor"
    :as-child="asChild"
    :class="rootClass"
    v-bind="passthroughAttrs"
  >
    <slot />
  </Primitive>
</template>
