<script lang="ts">
/* No props of its own — every attribute falls through. The block itself is load-bearing:
   in a `<script setup>`-only SFC, `vue-eslint-parser` loses `ignoreRestSiblings` and the
   `const { class: _class, ...others }` omission below trips `no-unused-vars`. */
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';

/** A `tr` in a `Table`. Set `data-selected` to tint it with the selection fill. */
defineOptions({ name: 'TableRow', inheritAttrs: false });

/** The row cells — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLTableRowElement>('el');

const classes = computed(() =>
  cn(
    'border-b border-border last:border-0 transition-colors data-[selected]:bg-primary-soft',
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
  <tr ref="el" v-bind="rest" :class="classes">
    <slot />
  </tr>
</template>
