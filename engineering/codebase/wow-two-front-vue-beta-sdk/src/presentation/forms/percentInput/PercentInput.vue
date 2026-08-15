<script lang="ts">
import type { NumberInputProps } from '../numberInput';

/* React spelled this `Omit<NumberInputProps, 'children'>`; `children` is a slot here, so the
   whole `NumberInput` surface carries over unchanged. Kept an interface, not a type alias:
   the SFC prop resolver reads a declared interface, and the name has to stay importable. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PercentInputProps extends NumberInputProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import NumberInput from '../numberInput/NumberInput.vue';

/**
 * `NumberInput` with a trailing `%` decoration. Input value remains the
 * bare number (interpret as 0–100 in your form).
 */
/* `inheritAttrs: false` so `class` folds into the wrapper's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'PercentInput', inheritAttrs: false });

const props = defineProps<PercentInputProps>();

const attrs = useAttrs();

/*
 * No `defineEmits` on purpose: `update:modelValue` / `value-change` are NOT re-declared, so a
 * consumer's listeners stay in `useAttrs()` and reach `NumberInput` through the passthrough
 * below — declaring them here would strip the listeners and silently break `v-model`.
 */
const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const wrapperClass = computed(() => cn('relative', attrs.class as ClassValue));

const inner = useTemplateRef<{ el: HTMLInputElement | null }>('inner');

/** The rendered `<input>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: computed(() => inner.value?.el ?? null) });
</script>

<template>
  <div :class="wrapperClass">
    <NumberInput ref="inner" v-bind="{ ...props, ...passthroughAttrs }" class="pr-16" />
    <span class="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
      %
    </span>
  </div>
</template>
