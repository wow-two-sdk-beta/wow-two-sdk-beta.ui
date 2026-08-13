<script lang="ts">
/** Defines the EmptyState visual size. */
export const EmptyStateSize = {
  /** Refers to the small layout. */
  Sm: 'sm',
  /** Refers to the medium layout. */
  Md: 'md',
  /** Refers to the large layout. */
  Lg: 'lg',
} as const;

export type EmptyStateSize = (typeof EmptyStateSize)[keyof typeof EmptyStateSize];

export interface EmptyStateProps {
  /**
   * The heading copy. React typed this `ReactNode`; a scalar stays a prop so it
   * remains the discriminator, and the same-named slot is the rich override.
   */
  title: string | number;

  /** The body copy below the title. Same prop-plus-slot pairing as `title`. */
  description?: string | number;

  /** The visual size. Default `md`. */
  size?: EmptyStateSize;
}

const SIZE: Record<EmptyStateSize, { wrap: string; iconBox: string }> = {
  sm: { wrap: 'gap-2 py-6', iconBox: 'h-10 w-10' },
  md: { wrap: 'gap-3 py-10', iconBox: 'h-14 w-14' },
  lg: { wrap: 'gap-4 py-16', iconBox: 'h-20 w-20' },
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import Heading from '../heading/Heading.vue';
import Text from '../text/Text.vue';

/**
 * Empty-list / no-results affordance: icon + title + description + actions.
 * Pass any subset; the component centers everything vertically.
 */
defineOptions({ name: 'EmptyState', inheritAttrs: false });

/**
 * React's `icon` / `actions` were structural `ReactNode` props — regions with no
 * prop equivalent in Vue, so they become slots. `title` / `description` stay
 * props (scalars) with a same-named slot as the rich override.
 */
defineSlots<{
  /** The optional icon, centered in a tinted disc. */
  icon(): unknown;
  /** The heading copy — overrides the `title` prop's rendering. */
  title(): unknown;
  /** The body copy — overrides the `description` prop's rendering. */
  description(): unknown;
  /** The action(s) — usually one or two `Button`s. */
  actions(): unknown;
}>();

const props = withDefaults(defineProps<EmptyStateProps>(), {
  description: undefined,
  size: EmptyStateSize.Md,
});

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLDivElement>('el');

const sizing = computed(() => SIZE[props.size]);

const headingSize = computed(() =>
  props.size === EmptyStateSize.Sm ? 'md' : props.size === EmptyStateSize.Lg ? 'xl' : 'lg',
);

const textSize = computed(() => (props.size === EmptyStateSize.Lg ? 'md' : 'sm'));

const hasDescription = computed(() => props.description !== undefined || !!slots.description);

const classes = computed(() =>
  cn(
    'flex flex-col items-center text-center',
    sizing.value.wrap,
    attrs.class as string | undefined,
  ),
);

const iconBoxClasses = computed(() =>
  cn(
    'flex items-center justify-center rounded-full bg-muted text-muted-foreground',
    sizing.value.iconBox,
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
  <div ref="el" v-bind="rest" :class="classes">
    <div v-if="$slots.icon" :class="iconBoxClasses"><slot name="icon" /></div>
    <Heading :level="3" :size="headingSize">
      <slot name="title">{{ props.title }}</slot>
    </Heading>
    <Text v-if="hasDescription" color="muted" :size="textSize">
      <slot name="description">{{ props.description }}</slot>
    </Text>
    <div v-if="$slots.actions" class="mt-2 flex items-center gap-2"><slot name="actions" /></div>
  </div>
</template>
