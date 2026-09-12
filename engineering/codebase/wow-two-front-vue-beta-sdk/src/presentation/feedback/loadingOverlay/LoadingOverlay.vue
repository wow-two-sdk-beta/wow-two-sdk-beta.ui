<script lang="ts">
import type { Size } from '../../../foundation/styles';
import type { SpinnerTone } from '../spinner/Spinner.variants';

export interface LoadingOverlayProps {
  /** The mount state. Default `true`. */
  readonly isOpen?: boolean;

  /** The caption under the spinner. Default `"Loading…"`. Rich content → the `label` slot. */
  readonly label?: string;

  /** The inline-positioning toggle — the scrim sits absolutely inside the parent (must be `position: relative`). */
  readonly isInline?: boolean;

  /** The backdrop-blur toggle. */
  readonly hasBlur?: boolean;

  /** The spinner diameter step. Default `lg`. */
  readonly spinnerSize?: Size;

  /** The spinner color tone. Default `brand`. */
  readonly spinnerTone?: SpinnerTone;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useSlots, useTemplateRef } from 'vue';
import { cn, Size as SizeToken } from '../../../foundation/styles';
import { Presence } from '../../../foundation/primitives';
import BackdropOverlay from '../../overlays/backdropOverlay/BackdropOverlay.vue';
import Spinner from '../spinner/Spinner.vue';
import { SpinnerTone as SpinnerToneToken } from '../spinner/Spinner.variants';

/**
 * Renders a scrim and centered spinner that block interaction with a region during a long task.
 * `isInline` scopes the scrim to a `position: relative` parent; default covers the
 * viewport via `BackdropOverlay`.
 *
 * React split the scrim into a `forwardRef` `LoadingScrim` so the two branches
 * could share it and `Presence` had a spreadable node to clone. Vue's `Presence`
 * clones whatever single element it is given, so the two branches collapse into
 * one `<div>` whose position/elevation classes switch on `isInline` — same DOM,
 * one component fewer.
 */
defineOptions({ name: 'LoadingOverlay', inheritAttrs: false });

/** Extra content below the label — React's `children`. */
defineSlots<{ default?(): unknown; label?(): unknown }>();

const props = withDefaults(defineProps<LoadingOverlayProps>(), {
  isOpen: true,
  label: 'Loading…',
  isInline: false,
  hasBlur: false,
  spinnerSize: SizeToken.Lg,
  spinnerTone: SpinnerToneToken.Brand,
});

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLDivElement>('el');

const hasLabel = computed(() => Boolean(props.label) || Boolean(slots.label));

/** Falls back to `"Loading"` when the caller blanks the caption. */
const spinnerLabel = computed(() => props.label || 'Loading');

/*
 * `data-state` is injected by <Presence>; the fade tokens are gated on it so
 * enter plays on mount and exit plays before Presence defers the unmount.
 * The inline scrim carries the tint and the blur itself; the viewport one is
 * click-through and leaves both to the portalled `BackdropOverlay` behind it.
 */
const classes = computed(() =>
  cn(
    'flex flex-col items-center justify-center gap-3',
    'motion-safe:data-[state=isOpen]:animate-(--animate-fade-in)',
    'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
    'motion-reduce:animate-none',
    props.isInline
      ? ['absolute inset-0 z-banner bg-background/70', props.hasBlur && 'backdrop-blur-sm']
      : 'fixed inset-0 z-modal pointer-events-none',
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
  <!-- `BackdropOverlay` self-wraps in `Presence`; driving `is-isOpen` with `isOpen` lets its
       fade-out play before it defers its own unmount. -->
  <BackdropOverlay v-if="!props.isInline" :isOpen="props.isOpen" :is-blurred="props.hasBlur" class="bg-background/70" />
  <Presence :is-present="props.isOpen">
    <div ref="el" role="status" v-bind="rest" :class="classes">
      <Spinner :size="props.spinnerSize" :tone="props.spinnerTone" :label="spinnerLabel" />
      <div v-if="hasLabel" class="text-sm text-foreground">
        <slot name="label">{{ props.label }}</slot>
      </div>
      <slot />
    </div>
  </Presence>
</template>
