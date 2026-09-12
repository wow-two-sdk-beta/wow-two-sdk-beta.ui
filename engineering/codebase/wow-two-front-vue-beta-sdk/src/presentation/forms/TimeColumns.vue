<script lang="ts">
// Shared hour/minute column pair for TimePicker, TimeInput and DateTimeInput.
// Co-located in `forms/` as a domain-internal helper, exactly like `MonthGrid.vue`.
// Owns:
//   - the two scrollable listboxes (24 hours × `minuteStep` minutes)
//   - the selected-cell styling and its hover ladder
//   - scrolling the selected cells into view on mount (i.e. each time a popover opens)
//
// Consumers provide the current `modelValue` and an `update:modelValue` listener; the merge of the
// untouched column with the picked one happens here, so every consumer gets it identically.
//
// Not exported from `forms/index.ts` — internal only.

import type { Temporal } from 'temporal-polyfill';

export interface TimeColumnsProps {
  /** The selected time. `null` renders both columns with nothing selected. */
  readonly modelValue: Temporal.PlainTime | null;

  /** The minute interval between rows. Default 5. */
  readonly minuteStep?: number;
}

const HoursOfDay = Array.from({ length: 24 }, (_, i) => i);
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { Temporal as TemporalValue } from 'temporal-polyfill';
import { cn } from '../../foundation/styles';

/** Renders the paired hour and minute listboxes, scrolling the selected rows into view when opened. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'TimeColumns', inheritAttrs: false });

const props = withDefaults(defineProps<TimeColumnsProps>(), { minuteStep: 5 });

const emit = defineEmits<{ 'update:modelValue': [value: Temporal.PlainTime] }>();

const attrs = useAttrs();

const hoursEl = useTemplateRef<HTMLDivElement>('hoursEl');
const minutesEl = useTemplateRef<HTMLDivElement>('minutesEl');

const minuteList = computed(() => {
  const list: Array<number> = [];
  for (let m = 0; m < 60; m += props.minuteStep) list.push(m);
  return list;
});

/*
 * Scroll the selected hour/minute into view. `onMounted` — never runs on the server, so
 * `requestAnimationFrame` is safe here without a `typeof` guard. Mount is the right hook
 * because an overlay unmounts its panel on close, so this runs on every open.
 */
let raf = 0;
onMounted(() => {
  raf = requestAnimationFrame(() => {
    hoursEl.value?.querySelector<HTMLButtonElement>('[data-selected]')?.scrollIntoView({
      block: 'center',
    });
    minutesEl.value?.querySelector<HTMLButtonElement>('[data-selected]')?.scrollIntoView({
      block: 'center',
    });
  });
});
onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf);
});

function update(next: { hour?: number; minute?: number }): void {
  emit(
    'update:modelValue',
    TemporalValue.PlainTime.from({
      hour: next.hour ?? props.modelValue?.hour ?? 0,
      minute: next.minute ?? props.modelValue?.minute ?? 0,
    }),
  );
}

/*
 * Hover ladder, shared with `MonthGrid`:
 *   unselected → `bg-primary/10`, the package's ghost/outline hover (see `Button.variants`)
 *   selected   → `bg-primary/90`, the package's solid-surface hover
 * A flat `hover:bg-primary` left the selected cell with no hover feedback at all, and
 * `hover:bg-muted` is indistinguishable from the popover surface in most themes.
 */
function cellClass(isSelected: boolean): string {
  return cn(
    'grid h-8 w-12 place-items-center rounded-sm text-sm transition-colors hover:bg-primary/10',
    isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const OwnedAttributes: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OwnedAttributes.has(key))),
);

const rootClass = computed(() =>
  cn(
    'flex gap-1 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md',
    attrs.class as ClassValue,
  ),
);

const HourList = HoursOfDay;

const root = useTemplateRef<HTMLDivElement>('root');

defineExpose({ el: root });
</script>

<template>
  <div ref="root" :class="rootClass" v-bind="passthroughAttrs">
    <div ref="hoursEl" role="listbox" aria-label="Hours" class="flex max-h-56 flex-col gap-0.5 overflow-y-auto pr-1">
      <button
        v-for="h in HourList"
        :key="h"
        type="button"
        role="option"
        :aria-selected="props.modelValue?.hour === h"
        :data-selected="props.modelValue?.hour === h ? '' : undefined"
        :class="cellClass(props.modelValue?.hour === h)"
        @click="update({ hour: h })"
      >
        {{ pad(h) }}
      </button>
    </div>
    <div class="w-px self-stretch bg-border" />
    <div
      ref="minutesEl"
      role="listbox"
      aria-label="Minutes"
      class="flex max-h-56 flex-col gap-0.5 overflow-y-auto pl-1"
    >
      <button
        v-for="m in minuteList"
        :key="m"
        type="button"
        role="option"
        :aria-selected="props.modelValue?.minute === m"
        :data-selected="props.modelValue?.minute === m ? '' : undefined"
        :class="cellClass(props.modelValue?.minute === m)"
        @click="update({ minute: m })"
      >
        {{ pad(m) }}
      </button>
    </div>
  </div>
</template>
