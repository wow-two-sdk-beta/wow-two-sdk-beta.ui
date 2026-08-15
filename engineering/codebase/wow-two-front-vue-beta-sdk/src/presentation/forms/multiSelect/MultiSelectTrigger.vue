<script lang="ts">
import type { InputState } from '../InputStyles';
import type { SelectSize } from '../select/Select.variants';

export interface MultiSelectTriggerProps {
  /** The trigger size. */
  size?: SelectSize;

  /** The validity surface. */
  state?: InputState;

  /**
   * The chip budget handed to the default `<MultiSelectTags />` — past it the rest collapse
   * into a `+N` block. Ignored when the trigger's default slot is filled.
   */
  maxVisibleTags?: number;
}
/* React also inherited `Omit<SelectTriggerVariants, 'size' | 'state'>` — the `border` / `ring`
   axes — but never forwarded them to `selectTriggerVariants`, so they were dead props that
   landed on the DOM as unknown attributes. Only the two axes the original consumed are here. */
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { PopoverTrigger } from '../../overlays';
import { InputState as InputStateValue } from '../InputStyles';
import { selectTriggerVariants } from '../select/Select.variants';
import { useMultiSelectContext } from './MultiSelectContext';
import MultiSelectTags from './MultiSelectTags.vue';

/** The button that opens the dropdown and displays the selected chips. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call, and so the rest
   of the attrs land on the inner `<button>`. */
defineOptions({ name: 'MultiSelectTrigger', inheritAttrs: false });

/** The trigger content — defaults to `<MultiSelectTags />`. React's `children`. */
defineSlots<{ default?(): unknown }>();

const props = defineProps<MultiSelectTriggerProps>();

const attrs = useAttrs();
const slots = useSlots();
const root = useTemplateRef<HTMLButtonElement>('root');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useMultiSelectContext();

/* `aria-label` is read off `attrs`, never declared: a declared `'aria-label'` prop arrives as
   `props.ariaLabel`, so `props['aria-label']` is always undefined and no accessible name
   renders. Left in the fallthrough set, it also still lands on the button. */
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);

const triggerState = computed(() => props.state ?? (ctx.isInvalid ? InputStateValue.Invalid : InputStateValue.Default));

/* Names the trigger from the Field label when present; an explicit aria-label always wins. */
const labelledBy = computed(() => (!ariaLabel.value ? ctx.labelId : undefined));

function onKeydown(event: KeyboardEvent): void {
  /* Runs after any caller-supplied `@keydown` (declared after `v-bind`), exactly as React's
     `onKeyDown?.(e)` ran before this body. */
  if (event.defaultPrevented) return;
  if (event.key === 'Backspace' && ctx.values.length > 0) {
    ctx.setValues(ctx.values.slice(0, -1));
  }
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const buttonClass = computed(() =>
  cn(
    selectTriggerVariants({ size: props.size, state: triggerState.value }),
    'h-auto min-h-10 flex-wrap py-1.5',
    attrs.class as ClassValue,
  ),
);

/* Chevron rotate kept; gated motion-safe so reduced-motion users get an instant flip, not a
   tween. Panel pop-in/out is owned by PopoverContent (Presence + --animate-pop-*). */
const chevronClass = computed(() =>
  cn('h-4 w-4 shrink-0 self-center text-muted-foreground motion-safe:transition-transform', ctx.open && 'rotate-180'),
);

const hasContent = computed(() => Boolean(slots.default));

const ChevronDownIcon = ChevronDown;

/** The rendered `<button>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <PopoverTrigger as-child>
    <button
      ref="root"
      type="button"
      :id="ctx.fieldId"
      :disabled="ctx.isDisabled"
      :aria-invalid="triggerState === 'invalid' || undefined"
      :aria-labelledby="labelledBy"
      :aria-describedby="ctx.describedBy"
      :class="buttonClass"
      v-bind="passthroughAttrs"
      @keydown="onKeydown"
    >
      <slot v-if="hasContent" />
      <MultiSelectTags v-else :max-visible="maxVisibleTags" />
      <ChevronDownIcon :class="chevronClass" />
    </button>
  </PopoverTrigger>
</template>
