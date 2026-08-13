<script lang="ts">
import type { Size } from '../../../foundation/utils';

export interface LabelProps {
  /** The required state, showing a `*` indicator. Auto-derived from `FormControl.isRequired` when present. */
  isRequired?: boolean;

  /** The visual size. Default `md`. */
  size?: Size;

  /**
   * The id of the labelled control — React's `htmlFor`. Auto-filled from
   * `FormControl` context when omitted.
   */
  htmlFor?: string;

  /** The DOM spelling of {@link LabelProps.htmlFor}, which wins when both are set. */
  for?: string;

  /**
   * The label's own id. An explicit id detaches the node from the context's
   * `labelId`, so the label stops registering as the context's naming chrome.
   */
  id?: string;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const SIZE: Partial<Record<Size, string>> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
};
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Size as SizeValue } from '../../../foundation/utils';
import { useFormControl, useFormControlChrome } from '../../../foundation/primitives';

/**
 * `<label>` wired to `FormControl` context — when wrapped in a `FormControl`
 * it auto-fills `htmlFor` and `id`. Standalone use: pass `htmlFor` directly.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Label', inheritAttrs: false });

/* `children` has no prop counterpart — the label copy is the default slot. */
const props = withDefaults(defineProps<LabelProps>(), {
  size: SizeValue.Md,
  /* `isRequired` must stay `undefined` when absent: the value falls back to the form
     control's own `isRequired`, and Vue's Boolean casting would turn an absent prop into
     an explicit `false` that shadows the context. */
  isRequired: undefined,
});

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useFormControl();

/* Registration flips the context's `labelledBy` on — widgets that name themselves via
   `aria-labelledby` reference the label only while it exists. An explicit `id` prop
   detaches the node from the context's labelId. Passed as a getter to stay reactive. */
useFormControlChrome('label', () => props.id == null);

const isRequired = computed(() => props.isRequired ?? ctx?.isRequired ?? false);
const labelFor = computed(() => props.for ?? props.htmlFor ?? ctx?.id);
const labelId = computed(() => props.id ?? ctx?.labelId);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    SIZE[props.size] ?? SIZE.md,
    'font-medium text-foreground',
    ctx?.isDisabled && 'opacity-60',
    attrs.class as ClassValue,
  ),
);

const root = useTemplateRef<HTMLLabelElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <label
    ref="root"
    :for="labelFor"
    :id="labelId"
    :class="rootClass"
    v-bind="passthroughAttrs"
  >
    <slot />
    <span v-if="isRequired" class="ml-0.5 text-destructive" aria-hidden="true">*</span>
  </label>
</template>
