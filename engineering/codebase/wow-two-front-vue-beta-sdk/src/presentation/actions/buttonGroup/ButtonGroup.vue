<script lang="ts">
import type { HTMLAttributes } from 'vue';
import type { Orientation } from '../../../foundation/utils';

/* Native div attributes stay in attribute fallthrough rather than becoming runtime props. */
export interface ButtonGroupProps extends /* @vue-ignore */ HTMLAttributes {
  /** The visual orientation. Default `horizontal`. */
  orientation?: Orientation;

  /** The attached state — groups children with collapsed inner radii (connected look). Default `true`. */
  isAttached?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Orientation as OrientationValue } from '../../../foundation/utils';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ButtonGroup', inheritAttrs: false });

const props = withDefaults(defineProps<ButtonGroupProps>(), {
  orientation: OrientationValue.Horizontal,
  isAttached: true,
});

const attrs = useAttrs();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const isHorizontal = computed(() => props.orientation === OrientationValue.Horizontal);

const rootClass = computed(() =>
  cn(
    'inline-flex',
    isHorizontal.value ? 'flex-row' : 'flex-col',
    props.isAttached
      ? isHorizontal.value
        ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
        : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'
      : 'gap-2',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <!-- Visually groups action-children — collapses inner radii when `isAttached`. -->
  <div ref="root" role="group" :data-orientation="orientation" :class="rootClass" v-bind="passthroughAttrs">
    <slot />
  </div>
</template>
