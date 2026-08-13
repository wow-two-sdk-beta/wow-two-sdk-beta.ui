<script lang="ts">
import type { StackProps } from '../stack/Stack.vue';

export type HStackProps = Omit<StackProps, 'direction'>;
</script>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import Stack from '../stack/Stack.vue';

/** Stack preset: `direction="row"`. */
defineOptions({ name: 'HStack', inheritAttrs: false });

/**
 * No `defineProps` — every `StackProps` key falls through `$attrs` onto the
 * inner `Stack`, which already declares them. `v-bind="$attrs"` sits after
 * `direction` for the same reason React spread `{...props}` after it: the
 * spread wins, and `HStackProps` types `direction` away.
 */
const inner = useTemplateRef<InstanceType<typeof Stack>>('inner');

/** The inner `Stack`'s root element — the React original's forwarded ref. */
const el = computed(() => inner.value?.el ?? null);

defineExpose({ el });
</script>

<template>
  <Stack ref="inner" direction="row" v-bind="$attrs"><slot /></Stack>
</template>
