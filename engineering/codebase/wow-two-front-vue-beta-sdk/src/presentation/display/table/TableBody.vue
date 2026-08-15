<script lang="ts">
/* No props of its own — every attribute falls through. The block itself is load-bearing:
   in a `<script setup>`-only SFC, `vue-eslint-parser` loses `ignoreRestSiblings` and the
   `const { class: _class, ...others }` omission below trips `no-unused-vars`. */
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useTableContext } from './TableContext';

/** The `tbody` section of a `Table` — picks up striping / hover from the root. */
defineOptions({ name: 'TableBody', inheritAttrs: false });

/** The body rows — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLTableSectionElement>('el');
const table = useTableContext();

const classes = computed(() =>
  cn(
    table.isStriped && '[&>tr:nth-child(even)]:bg-muted/30',
    table.isHoverable && '[&>tr:hover]:bg-muted',
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
  <tbody ref="el" v-bind="rest" :class="classes">
    <slot />
  </tbody>
</template>
