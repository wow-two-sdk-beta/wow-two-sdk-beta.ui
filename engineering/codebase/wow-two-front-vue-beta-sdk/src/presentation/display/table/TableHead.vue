<script lang="ts">
/** Defines the Table header typography treatment. */
export const TableHeadVariant = {
  /** Refers to the uppercase, tracked default. */
  Uppercase: 'uppercase',
  /** Refers to normal-case `text-sm` heads. */
  Plain: 'plain',
} as const;

export type TableHeadVariant = (typeof TableHeadVariant)[keyof typeof TableHeadVariant];

const HEAD_VARIANT: Record<TableHeadVariant, string> = {
  uppercase: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  plain: 'text-sm font-semibold text-foreground',
};

export interface TableHeadProps {
  /** The typography treatment for the header row. Defaults to `uppercase` (current look). */
  headVariant?: TableHeadVariant;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/** The `thead` section of a `Table`. */
defineOptions({ name: 'TableHead', inheritAttrs: false });

/** The header rows — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<TableHeadProps>(), {
  headVariant: TableHeadVariant.Uppercase,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLTableSectionElement>('el');

const classes = computed(() =>
  cn(
    'border-b border-border bg-muted/50',
    HEAD_VARIANT[props.headVariant],
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
  <thead ref="el" v-bind="rest" :class="classes"><slot /></thead>
</template>
