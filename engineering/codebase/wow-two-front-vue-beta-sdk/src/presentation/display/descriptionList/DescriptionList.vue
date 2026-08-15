<script lang="ts">
export interface DescriptionListItem {
  /** React typed this `ReactNode`; the scalar form is what an array item can carry. */
  label: string | number;
  value: string | number;
}

/** Defines the DescriptionList row layout. */
export const DescriptionListLayout = {
  /** Refers to label/value on the same line. */
  Inline: 'inline',
  /** Refers to label stacked above its value. */
  Stacked: 'stacked',
} as const;

export type DescriptionListLayout = (typeof DescriptionListLayout)[keyof typeof DescriptionListLayout];

/** Defines the DescriptionList inter-row density. */
export const DescriptionListDensity = {
  /** Refers to tight row spacing. */
  Sm: 'sm',
  /** Refers to medium row spacing. */
  Md: 'md',
  /** Refers to loose row spacing. */
  Lg: 'lg',
} as const;

export type DescriptionListDensity = (typeof DescriptionListDensity)[keyof typeof DescriptionListDensity];

export interface DescriptionListProps {
  items: ReadonlyArray<DescriptionListItem>;

  /** The layout direction. `inline` renders label/value on the same line; `stacked` puts label above. */
  layout?: DescriptionListLayout;

  /** The density between rows. Default `md`. */
  density?: DescriptionListDensity;
}

const ROW_GAP: Record<NonNullable<DescriptionListProps['density']>, string> = {
  sm: 'gap-y-1',
  md: 'gap-y-2',
  lg: 'gap-y-3',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Semantic `<dl>` for label-value pairs (settings panels, property lists).
 * Inline layout uses a 2-column grid; stacked puts each value below its label.
 */
defineOptions({ name: 'DescriptionList', inheritAttrs: false });

/**
 * React's items carried `ReactNode` cells; a Vue array prop can only carry
 * scalars, so each cell gets a scoped slot as the rich override. Omitting the
 * slot renders `item.label` / `item.value` exactly as React did.
 */
defineSlots<{
  /** The rich override for a row's label cell. */
  label?(props: { item: DescriptionListItem; index: number }): unknown;

  /** The rich override for a row's value cell. */
  value?(props: { item: DescriptionListItem; index: number }): unknown;
}>();

const props = withDefaults(defineProps<DescriptionListProps>(), {
  layout: DescriptionListLayout.Inline,
  density: DescriptionListDensity.Md,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDListElement>('el');

const classes = computed(() =>
  cn(
    'text-sm',
    props.layout === DescriptionListLayout.Inline ? 'grid grid-cols-[max-content_1fr] gap-x-4' : 'flex flex-col gap-1',
    ROW_GAP[props.density],
    attrs.class as string | undefined,
  ),
);

const rowClasses = computed(() =>
  cn('contents', props.layout === DescriptionListLayout.Stacked && 'flex flex-col gap-0.5'),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <dl ref="el" v-bind="rest" :class="classes">
    <div v-for="(item, i) in props.items" :key="i" :class="rowClasses">
      <dt class="text-muted-foreground">
        <slot name="label" :item="item" :index="i">{{ item.label }}</slot>
      </dt>
      <dd class="text-foreground">
        <slot name="value" :item="item" :index="i">{{ item.value }}</slot>
      </dd>
    </div>
  </dl>
</template>
