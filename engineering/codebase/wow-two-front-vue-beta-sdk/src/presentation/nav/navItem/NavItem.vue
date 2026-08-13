<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface NavItemProps {
  /** The escape hatch to render the child element instead of an `<a>` (router Link). */
  asChild?: boolean;

  /** The active state (visual + `aria-current="page"`). */
  isActive?: boolean;

  /** The visual size. Default `md`. */
  size?: Size;
}

const SIZE: Record<Size, string> = {
  xs: 'h-7 px-1.5 text-xs gap-1.5',
  sm: 'h-8 px-2 text-sm gap-2',
  md: 'h-9 px-2.5 text-sm gap-2.5',
  lg: 'h-11 px-3 text-base gap-3',
  xl: 'h-12 px-3.5 text-base gap-3.5',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef, type ComponentPublicInstance } from 'vue';
import { cn, dataAttr, Size as SizeToken } from '../../../foundation/utils';
import { Primitive, Slottable } from '../../../foundation/primitives';

/**
 * Sidebar / nav row — icon + label + trailing slot + active state. Default `<a>`;
 * pass `asChild` to forward to a router Link. Sets `aria-current="page"` when `isActive`.
 */
defineOptions({ name: 'NavItem', inheritAttrs: false });

defineSlots<{
  /** The visual label — React's `children`. */
  default(): unknown;

  /** The leading icon. React's `icon` prop. */
  icon?(): unknown;

  /** The trailing slot — typically a count badge or status dot. React's `trailing` prop. */
  trailing?(): unknown;
}>();

/** `isActive` defaults to `undefined`, not `false` — an absent optional boolean must stay absent. */
const props = withDefaults(defineProps<NavItemProps>(), {
  asChild: false,
  isActive: undefined,
  size: SizeToken.Md,
});

const attrs = useAttrs();
const inner = useTemplateRef<ComponentPublicInstance>('inner');

const classes = computed(() =>
  cn(
    'group inline-flex w-full items-center rounded-md font-medium text-foreground transition-colors',
    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'data-[active]:bg-primary-soft data-[active]:text-primary-soft-foreground',
    SIZE[props.size],
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/*
 * Under `as-child` the consumer's element (a router Link) becomes the row, and
 * `Slottable` marks it as the merge target so the icon / trailing spans compose
 * *inside* it. React additionally re-wrapped the consumer element's own children
 * in the `flex-1 truncate` label span (`cloneElement`); a template cannot reach
 * into a slot child's children, so the label rides as a bare node there and the
 * trailing span takes `ms-auto` to keep the same right-aligned layout. The `<a>`
 * path renders the label span exactly as React did.
 */
const trailingClasses = computed(() => cn('shrink-0', props.asChild && 'ms-auto'));

/** `Primitive` renders the real element, so its `$el` is this component's root. */
const el = computed(() => (inner.value?.$el ?? null) as HTMLElement | null);

defineExpose({ el });
</script>

<template>
  <Primitive
    ref="inner"
    as="a"
    :as-child="props.asChild"
    :aria-current="props.isActive ? 'page' : undefined"
    :data-active="dataAttr(props.isActive)"
    v-bind="rest"
    :class="classes"
  >
    <span v-if="$slots.icon" class="text-muted-foreground group-data-[active]:text-current">
      <slot name="icon" />
    </span>
    <Slottable v-if="props.asChild"><slot /></Slottable>
    <span v-else class="flex-1 truncate text-left"><slot /></span>
    <span v-if="$slots.trailing" :class="trailingClasses"><slot name="trailing" /></span>
  </Primitive>
</template>
