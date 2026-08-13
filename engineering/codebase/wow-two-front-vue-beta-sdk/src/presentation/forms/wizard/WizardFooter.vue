<script lang="ts">
export interface WizardFooterProps {
  /** The Back button's text. Fill the `prevLabel` slot for richer content. */
  prevLabel?: string | number;

  /** The Next button's text. Fill the `nextLabel` slot for richer content. */
  nextLabel?: string | number;

  /** The final step's confirm text. Fill the `submitLabel` slot for richer content. */
  submitLabel?: string | number;

  /** The visibility of the Prev button when not on first step. Default true. */
  hasPrev?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useWizard } from './WizardContext';

/** The Back / Next (or Finish) control row. */
defineOptions({ name: 'WizardFooter', inheritAttrs: false });

defineSlots<{
  prevLabel?(): unknown;
  nextLabel?(): unknown;
  submitLabel?(): unknown;
}>();

withDefaults(defineProps<WizardFooterProps>(), {
  prevLabel: 'Back',
  nextLabel: 'Next',
  submitLabel: 'Finish',
  hasPrev: true,
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useWizard();

const isFirst = computed(() => ctx.currentIndex === 0);
const isFinal = computed(() => ctx.currentStep?.isFinal ?? false);
const showPrevButton = computed(() => ctx.canGoBack && !isFirst.value);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rowClass = computed(() =>
  cn('mt-2 flex items-center justify-between gap-3', attrs.class as ClassValue),
);

function onNext(): void {
  void ctx.next();
}

defineExpose({ el });
</script>

<template>
  <div ref="el" :class="rowClass" v-bind="passthroughAttrs">
    <button
      v-if="hasPrev && showPrevButton"
      type="button"
      :disabled="ctx.isPending"
      class="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
      @click="ctx.back()"
    >
      <slot name="prevLabel">{{ prevLabel }}</slot>
    </button>
    <span v-else />
    <button
      type="button"
      :disabled="ctx.isPending"
      class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      @click="onNext"
    >
      <template v-if="ctx.isPending">…</template>
      <slot v-else-if="isFinal" name="submitLabel">{{ submitLabel }}</slot>
      <slot v-else name="nextLabel">{{ nextLabel }}</slot>
    </button>
  </div>
</template>
