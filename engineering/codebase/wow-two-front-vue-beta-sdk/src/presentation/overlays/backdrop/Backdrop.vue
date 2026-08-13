<script lang="ts">
/** Defines the pointer-event behavior of a `Backdrop` scrim. */
export const BackdropPointerEvents = {
  /** Refers to a scrim that intercepts pointer events. */
  Auto: 'auto',
  /** Refers to a scrim that lets clicks pass through. */
  None: 'none',
} as const;

export type BackdropPointerEvents =
  (typeof BackdropPointerEvents)[keyof typeof BackdropPointerEvents];

/**
 * The prop surface of `Backdrop`.
 *
 * React's `open` is spelled `isOpen` here, matching the house boolean prefix
 * (`isBlurred`, `isInline`); React's `className` / `style` are Vue's `class` /
 * `style` attrs and so are absent. Everything else keeps its React name.
 */
export interface BackdropProps {
  /** The mount state. Default `true`. */
  isOpen?: boolean;

  /** The backdrop-blur toggle. */
  isBlurred?: boolean;

  /** The pointer-event behavior; `'none'` lets clicks pass through. Default `'auto'`. */
  pointerEvents?: BackdropPointerEvents;

  /** The in-place render toggle — skips the Portal wrap. */
  isInline?: boolean;
}
</script>

<script setup lang="ts">
import { computed, normalizeStyle, useAttrs } from 'vue';
import { cn } from '../../../foundation/utils';
import { Portal, Presence } from '../../../foundation/primitives';

/* Fixed-position scrim. Used by Modal / Drawer / BottomSheet / LoadingOverlay; also public for custom overlay surfaces. */
defineOptions({ name: 'Backdrop', inheritAttrs: false });

/** Scrim content — React's `children`; a scrim is normally empty. */
defineSlots<{ default?(): unknown }>();

/**
 * `isOpen` carries a real `true` default (React's `open = true`), unlike the
 * controlled overlays where the absent-vs-`false` distinction is load-bearing:
 * a `Backdrop` has no uncontrolled mode to fall back to.
 */
const props = withDefaults(defineProps<BackdropProps>(), {
  isOpen: true,
  isBlurred: false,
  pointerEvents: 'auto',
  isInline: false,
});

const attrs = useAttrs();

// `data-state` is injected by <Presence>; the fade tokens are gated on it so
// enter plays on mount and exit plays before Presence defers the unmount.
const classes = computed(() =>
  cn(
    'fixed inset-0 z-overlay bg-black/50',
    'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
    'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
    props.isBlurred && 'backdrop-blur-sm',
    attrs.class as string | undefined,
  ),
);

/** `pointerEvents` is normalized first so a caller's `style` still wins — React's `{ pointerEvents, ...style }`. */
const inlineStyle = computed(() =>
  normalizeStyle([{ pointerEvents: props.pointerEvents }, attrs.style]),
);

/** Everything but `class` / `style`, both re-applied above. */
const rest = computed(() => {
  const { class: _class, style: _style, ...others } = attrs;
  return others;
});
</script>

<template>
  <!-- Two branches rather than a conditional wrapper: Vue has no `isInline ? node : <Portal>{node}</Portal>`. -->
  <Portal v-if="!props.isInline">
    <Presence :is-present="props.isOpen">
      <div v-bind="rest" :style="inlineStyle" :class="classes"><slot /></div>
    </Presence>
  </Portal>

  <Presence v-else :is-present="props.isOpen">
    <div v-bind="rest" :style="inlineStyle" :class="classes"><slot /></div>
  </Presence>
</template>
