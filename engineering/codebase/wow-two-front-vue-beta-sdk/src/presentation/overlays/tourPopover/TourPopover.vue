<script lang="ts">
import type { Ref } from 'vue';

/** Defines the side a TourPopover tooltip is placed on, relative to its target. */
export const Placement = {
  /** Refers to placement above the target. */
  Top: 'top',
  /** Refers to placement to the right of the target. */
  Right: 'right',
  /** Refers to placement below the target. */
  Bottom: 'bottom',
  /** Refers to placement to the left of the target. */
  Left: 'left',
} as const;

export type Placement = (typeof Placement)[keyof typeof Placement];

export interface TourPopoverStep {
  /** A CSS selector, or a template ref holding the element to spotlight. */
  readonly target: string | Ref<HTMLElement | null>;
  readonly title?: string;
  readonly body?: string;
  readonly placement?: Placement;
}

export interface TourPopoverProps {
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly steps: ReadonlyArray<TourPopoverStep>;
  readonly currentStep?: number;
  readonly defaultCurrentStep?: number;
  readonly padding?: number;
}
</script>

<script setup lang="ts">
import { useLocale } from '../../../foundation/i18n';
import { computed, ref, shallowRef, watch } from 'vue';
import { cn } from '../../../foundation/styles';
import { Key } from '../../../foundation/dom';
import { useControlled } from '../../../foundation/state';
import { useId } from '../../../foundation/identifiers';
import { useReducedMotion } from '../../../foundation/device';
import { Announce, Portal, Presence } from '../../../foundation/primitives';

const locale = useLocale();

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function rectFromTarget(target: TourPopoverStep['target']): Rect | null {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target.value;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function placementCoords(rect: Rect, placement: NonNullable<TourPopoverStep['placement']>, gap = 12) {
  switch (placement) {
    case Placement.Top:
      return { top: rect.top - gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' };
    case Placement.Right:
      return { top: rect.top + rect.height / 2, left: rect.left + rect.width + gap, transform: 'translate(0, -50%)' };
    case Placement.Bottom:
      return { top: rect.top + rect.height + gap, left: rect.left + rect.width / 2, transform: 'translate(-50%, 0)' };
    case Placement.Left:
      return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
  }
}

/**
 * Renders a multi-step tour — an SVG mask cut out around each step's target, plus a step tooltip.
 * The tooltip carries Next / Prev / Skip / Done.
 *
 * `TourPopoverStep.title` / `.body` are plain `string`: steps are data passed as a
 * prop, not slot content, and the announcement already required a string.
 */
defineOptions({ name: 'TourPopover', inheritAttrs: false });

const props = withDefaults(defineProps<TourPopoverProps>(), {
  /* `steps` stays declared-required — Vue still warns when it is missing — but a
     default keeps an absent (or transiently-undefined) value out of the indexed read
     in `step` below. Everything downstream already handles an absent step
     (`step.value?.…`, and the template gates on `v-if="mounted && step"`). */
  steps: () => [],
  defaultOpen: false,
  defaultCurrentStep: 0,
  padding: 8,
  /* `open` is the controlled-mode signal, and `useControlled` keys on `=== undefined`.
     A `boolean` prop is Boolean-castable, so without this explicit `undefined` Vue turns an
     ABSENT `open` into `false` — which reads as "controlled, and closed", pinning the tour
     shut and making `defaultOpen` dead. `currentStep` needs no such default: `number` is not
     Boolean-castable, so it already arrives as `undefined`. */
  open: undefined,
});

const emit = defineEmits<{
  /** Fires when the tour opens or closes — a close follows Done, Skip, or Escape. */
  'update:open': [open: boolean];

  /** Fires when the reader moves to a different step. */
  'update:currentStep': [index: number];

  /** Fires when the reader presses Done on the last step. */
  complete: [];

  /** Fires when the reader abandons the tour — the Skip button, or Escape. */
  skip: [];
}>();

const openCtl = useControlled<boolean>({
  controlled: () => props.open,
  default: () => props.defaultOpen,
  onChange: (value) => emit('update:open', value),
});
const stepCtl = useControlled<number>({
  controlled: () => props.currentStep,
  default: () => props.defaultCurrentStep,
  onChange: (value) => emit('update:currentStep', value),
});

const resolvedOpen = computed(() => openCtl.value.value);
const stepIndex = computed(() => stepCtl.value.value);

const rect = shallowRef<Rect | null>(null);
const titleId = useId('tour-title');
const descId = useId('tour-desc');
const maskId = useId('tour-mask');
const reducedMotion = useReducedMotion();

const step = computed(() => props.steps[stepIndex.value]);

/* Keep the Portal (scrim + tooltip) mounted while the pop-out plays — the
   component hard-unmounts on `!open`, which would kill the exit. Opening
   flips this true synchronously; closing defers the unmount until the
   tooltip's exit animation ends (`@animationend` below). Under reduced
   motion no animation fires, so drop it on the next frame instead. */
const mounted = ref(resolvedOpen.value);
watch(
  [resolvedOpen, reducedMotion],
  ([isOpen, isReduced], _previous, onCleanup) => {
    if (isOpen) {
      mounted.value = true;
      return;
    }
    if (!isReduced) return;
    const raf = requestAnimationFrame(() => {
      mounted.value = false;
    });
    onCleanup(() => cancelAnimationFrame(raf));
  },
  { immediate: true, flush: 'post' },
);

// Update rect when step changes / window scrolls / resizes.
watch(
  [resolvedOpen, step],
  ([isOpen, currentStepValue], _previous, onCleanup) => {
    if (!isOpen || !currentStepValue) return;
    /* `immediate: true` runs this on the server too, where there is no rAF and no `window`.
       The spotlight rect is measured from live DOM, so there is nothing to compute there —
       bail, and let the same watcher measure on the client. */
    if (typeof requestAnimationFrame === 'undefined' || typeof window === 'undefined') return;

    const update = () => {
      rect.value = rectFromTarget(currentStepValue.target);
    };
    // Defer to next frame so the target can mount / scroll into view.
    const handle = requestAnimationFrame(update);

    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true, capture: true });
    onCleanup(() => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    });
  },
  { immediate: true, flush: 'post' },
);

// Escape handling.
watch(
  resolvedOpen,
  (isOpen, _previous, onCleanup) => {
    if (!isOpen) return;
    // Same `immediate: true` SSR pass — there is no `document` to listen on there.
    if (typeof document === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === Key.Escape) {
        event.preventDefault();
        openCtl.setValue(false);
        emit('skip');
      }
    };
    document.addEventListener('keydown', onKey);
    onCleanup(() => document.removeEventListener('keydown', onKey));
  },
  { immediate: true, flush: 'post' },
);

const goNext = () => {
  if (stepIndex.value >= props.steps.length - 1) {
    openCtl.setValue(false);
    emit('complete');
  } else {
    stepCtl.setValue(stepIndex.value + 1);
  }
};

const goPrev = () => {
  if (stepIndex.value > 0) stepCtl.setValue(stepIndex.value - 1);
};

const skip = () => {
  openCtl.setValue(false);
  emit('skip');
};

const placement = computed(() => step.value?.placement ?? Placement.Bottom);

const tooltipCoords = computed(() => (rect.value ? placementCoords(rect.value, placement.value) : null));

/** Vue does not auto-suffix numeric style values with `px`. */
const tooltipStyle = computed(() => {
  const coords = tooltipCoords.value;
  if (!coords) return undefined;
  return {
    position: 'fixed' as const,
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    transform: coords.transform,
  };
});

const announcement = computed(() =>
  step.value?.title ? `Step ${stepIndex.value + 1} of ${props.steps.length}: ${step.value.title}` : '',
);

const bodyClasses = computed(() => cn('text-sm text-muted-foreground', step.value?.title && 'mt-1.5'));

/**
 * `Presence` clones `data-state` onto this node, so the pop (fade + slight
 * scale) runs gated on that state. `motion-safe` so reduced-motion users get
 * no movement.
 */
const tooltipClasses = cn(
  'z-popover w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-hidden',
  'motion-safe:data-[state=open]:animate-(--animate-pop-in)',
  'motion-safe:data-[state=closed]:animate-(--animate-pop-out)',
  'motion-reduce:animate-none',
);

/** Drops the Portal once the exit animation completes. */
const onTooltipAnimationEnd = () => {
  if (!resolvedOpen.value) mounted.value = false;
};
</script>

<template>
  <Portal v-if="mounted && step">
    <!-- SVG mask backdrop with cutout around target. Skipped while the
         target is unresolvable so a bare scrim never blocks the page.
         Gated on `open` (not `mounted`) so the scrim clears immediately on
         close while the tooltip plays its pop-out before unmount. -->
    <svg
      v-if="resolvedOpen && rect"
      aria-hidden="true"
      class="pointer-events-auto fixed inset-0 z-modal h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask :id="maskId">
          <rect width="100%" height="100%" fill="white" />
          <rect
            :x="rect.left - props.padding"
            :y="rect.top - props.padding"
            :width="rect.width + props.padding * 2"
            :height="rect.height + props.padding * 2"
            :rx="6"
            fill="black"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" :mask="`url(#${maskId})`" />
    </svg>

    <!-- Tooltip — wrapped in `Presence` so its pop-out plays before the
         component unmounts. `Presence` clones `data-state` ("open" | "closed")
         onto the panel, so the pop tokens run gated on that state; the exit's
         `@animationend` drops `mounted`. -->
    <Presence v-if="tooltipCoords" :is-present="resolvedOpen">
      <div
        role="dialog"
        aria-modal="false"
        :aria-labelledby="titleId"
        :aria-describedby="descId"
        :style="tooltipStyle"
        :class="tooltipClasses"
        @animationend="onTooltipAnimationEnd"
      >
        <div v-if="step.title" :id="titleId" class="text-sm font-semibold">{{ step.title }}</div>
        <div v-if="step.body" :id="descId" :class="bodyClasses">{{ step.body }}</div>
        <div class="mt-3 flex items-center justify-between gap-3">
          <span class="text-xs text-muted-foreground"> {{ stepIndex + 1 }} / {{ props.steps.length }} </span>
          <div class="flex items-center gap-2">
            <button type="button" class="text-xs text-muted-foreground hover:text-foreground" @click="skip">
              {{ locale.t('TourPopover.skip', undefined, 'Skip') }}
            </button>
            <button
              v-if="stepIndex > 0"
              type="button"
              class="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
              @click="goPrev"
            >
              {{ locale.t('TourPopover.back', undefined, 'Back') }}
            </button>
            <button
              type="button"
              class="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              @click="goNext"
            >
              {{ stepIndex >= props.steps.length - 1 ? 'Done' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </Presence>

    <Announce politeness="polite">{{ announcement }}</Announce>
  </Portal>
</template>
