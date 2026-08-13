<script lang="ts">
import type { StackProps } from '../stack/Stack.vue';

export type VStackProps = Omit<StackProps, 'direction'>;
</script>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import Stack from '../stack/Stack.vue';

/** Stack preset: `direction="column"` (default). Provided for symmetry with HStack. */
defineOptions({ name: 'VStack', inheritAttrs: false });

/** See `HStack` — every `StackProps` key falls through `$attrs` onto the inner `Stack`. */
const inner = useTemplateRef<InstanceType<typeof Stack>>('inner');

/** The inner `Stack`'s root element — the React original's forwarded ref. */
const el = computed(() => inner.value?.el ?? null);

defineExpose({ el });
</script>

<template>
  <Stack ref="inner" direction="column" v-bind="$attrs"><slot /></Stack>
</template>
