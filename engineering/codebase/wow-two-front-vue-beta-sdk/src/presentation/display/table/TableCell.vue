<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `TableCellProps` and consumers import it. */
export interface TableCellProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { DENSITY_CELL, useTableContext } from './TableContext';

/** A `td` in a `Table` — padding follows the root's density. */
defineOptions({ name: 'TableCell', inheritAttrs: false });

/** The cell content — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLTableCellElement>('el');
const table = useTableContext();

const classes = computed(() =>
  cn(DENSITY_CELL[table.density], 'align-middle', attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <td ref="el" v-bind="rest" :class="classes"><slot /></td>
</template>
