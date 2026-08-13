<script lang="ts">
import type {
  AbsolutePosition,
  PresenceAnimationDurationProp,
  SizeValue,
} from '../../../foundation/utils';
import { OverlayTransition } from './Overlay.variants';

/* Re-exported for ergonomic consumer imports — same shape as the shared types. */
export type OverlayPosition = AbsolutePosition;

/** Defines the visibility trigger of an `Overlay` while mounted. */
export const OverlayAppearOn = {
  /** Refers to an always-visible overlay. */
  Always: 'always',
  /** Refers to reveal-on-hover (and focus-within). */
  Hover: 'hover',
  /** Refers to reveal-on-focus-within. */
  FocusWithin: 'focus-within',
} as const;

export type OverlayAppearOn = (typeof OverlayAppearOn)[keyof typeof OverlayAppearOn];

export { OverlayTransition };
export type OverlayDuration = PresenceAnimationDurationProp;

/**
 * The prop surface of `Overlay`.
 *
 * React's `className` / `style` props are Vue's `class` / `style` attrs and so
 * are absent here; everything else keeps its React name. Like the original,
 * `Overlay` consumes only those two attrs — no other attribute is forwarded, by
 * design (`Overlay.standard.md` rule 10: it never sets `role` / `aria-*`; the
 * child carries its own semantics).
 */
export interface OverlayProps {
  /** The anchor location — preset corner/edge/center, or raw inset object. Default 'top-right'. */
  position?: OverlayPosition;

  /** The spacing from edge for preset positions. Default '0.5rem'. Ignored for custom inset object. */
  inset?: SizeValue;

  /** The z-index. Default 10. */
  zIndex?: number | string;

  /** The visibility trigger while mounted. Default 'always'. Hover / focus-within modes require parent `class="group"`. */
  appearOn?: OverlayAppearOn;

  /** The presence — when provided, controls mount/unmount with exit transition (defers unmount until transitionend). */
  isOpen?: boolean;

  /** The animation effect for show/hide. Defaults to 'fade' if any visibility gating is active, else 'none'. */
  transition?: OverlayTransition;

  /** The duration in ms. Number = symmetric; object = asymmetric enter/exit. Default 200. */
  transitionDuration?: OverlayDuration;

  /** The CSS timing function. Default 'ease-out'. */
  transitionEasing?: string;

  /** The single-child merge via `Primitive` (no extra wrapper div). Default true. */
  asChild?: boolean;
}
</script>

<script setup lang="ts">
import { computed, normalizeStyle, useAttrs } from 'vue';
import {
  cn,
  CssExtensions,
  TransitionExtensions,
  type AbsoluteInsetOverrides,
  type AbsolutePositionPreset,
} from '../../../foundation/utils';
import { Presence, Primitive } from '../../../foundation/primitives';
import { overlayVariants, OverlayVisibilityMode } from './Overlay.variants';

/* Renders a positioned overlay anchored to its nearest positioned ancestor — for image-corner controls, badges, hover-revealed actions, and conditionally mounted floating elements. */
defineOptions({ name: 'Overlay', inheritAttrs: false });

/** The content — a single element when `asChild` (default), or arbitrary content otherwise. */
defineSlots<{ default(): unknown }>();

/**
 * `isOpen: undefined` is load-bearing, not noise: Vue casts an absent `Boolean`
 * prop to `false` unless the declaration *owns* a `default` key, which would make
 * `isOpen !== undefined` always true and force every overlay into presence mode.
 * Declaring the default as `undefined` keeps the three states React had —
 * absent / `true` / `false`.
 */
const props = withDefaults(defineProps<OverlayProps>(), {
  position: 'top-right',
  zIndex: 10,
  appearOn: OverlayAppearOn.Always,
  asChild: true,
  isOpen: undefined,
  transition: undefined,
  transitionDuration: undefined,
  transitionEasing: undefined,
  inset: undefined,
});

const attrs = useAttrs();

const isPresenceMode = computed(() => props.isOpen !== undefined);
const isCustomPosition = computed(
  () => typeof props.position === 'object' && props.position !== null,
);

const effectiveTransition = computed<OverlayTransition>(
  () =>
    props.transition ??
    (isPresenceMode.value || props.appearOn !== OverlayAppearOn.Always
      ? OverlayTransition.Fade
      : OverlayTransition.None),
);

const visibilityMode = computed<OverlayVisibilityMode>(() =>
  isPresenceMode.value
    ? OverlayVisibilityMode.Presence
    : props.appearOn === OverlayAppearOn.Hover
      ? OverlayVisibilityMode.Hover
      : props.appearOn === OverlayAppearOn.FocusWithin
        ? OverlayVisibilityMode.FocusWithin
        : OverlayVisibilityMode.Always,
);

const classes = computed(() =>
  cn(
    overlayVariants({
      position: isCustomPosition.value
        ? 'custom'
        : (props.position as AbsolutePositionPreset),
      visibilityMode: visibilityMode.value,
      transition: effectiveTransition.value,
    }),
    attrs.class as string | undefined,
  ),
);

/**
 * A caller's `style` is normalized FIRST so the computed declarations below win —
 * the order of React's `{ ...style, zIndex, '--ui-overlay-*': … }`.
 */
const inlineStyle = computed(() => {
  const { enter, exit } = TransitionExtensions.resolveDuration(props.transitionDuration);

  const own: Record<string, string | number> = {
    zIndex: props.zIndex,
    // CSS vars consumed by tailwind variants — exit is the baseline
    // transition-duration; enter overrides it on hover / focus-within / open.
    '--ui-overlay-enter': `${enter}ms`,
    '--ui-overlay-exit': `${exit}ms`,
  };

  if (props.inset !== undefined) {
    own['--ui-overlay-inset'] = CssExtensions.toCss(props.inset);
  }

  if (props.transitionEasing) {
    own.transitionTimingFunction = props.transitionEasing;
  }

  if (isCustomPosition.value) {
    const p = props.position as AbsoluteInsetOverrides;
    if (p.top !== undefined) own.top = CssExtensions.toCss(p.top);
    if (p.right !== undefined) own.right = CssExtensions.toCss(p.right);
    if (p.bottom !== undefined) own.bottom = CssExtensions.toCss(p.bottom);
    if (p.left !== undefined) own.left = CssExtensions.toCss(p.left);
  }

  return normalizeStyle([attrs.style, own]);
});
</script>

<template>
  <!-- Presence clones the single child vnode to drive `data-state` + deferred unmount. -->
  <Presence v-if="isPresenceMode" :is-present="props.isOpen === true">
    <Primitive as="div" :as-child="props.asChild" :class="classes" :style="inlineStyle">
      <slot />
    </Primitive>
  </Presence>

  <Primitive
    v-else
    as="div"
    :as-child="props.asChild"
    :class="classes"
    :style="inlineStyle"
  >
    <slot />
  </Primitive>
</template>
