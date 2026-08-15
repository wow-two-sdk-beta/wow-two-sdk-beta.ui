<script lang="ts">
import type {
  Side,
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/utils';

/** Defines the max-size token for a `DrawerContent` panel. */
export const DrawerSize = {
  /** Refers to the small panel size. */
  Sm: 'sm',
  /** Refers to the medium panel size. */
  Md: 'md',
  /** Refers to the large panel size. */
  Lg: 'lg',
  /** Refers to the extra-large panel size. */
  Xl: 'xl',
  /** Refers to a panel that fills its cross-axis. */
  Full: 'full',
} as const;

export type DrawerSize = (typeof DrawerSize)[keyof typeof DrawerSize];

// Full-edge slide: the panel rests at translate-0 when open and is pushed
// fully off its own edge when closed. `transition-transform` (gated on
// `motion-safe:`) animates both enter and exit via Presence's data-state flip.
const SIDE_BASE: Record<Side, string> = {
  right:
    'inset-y-0 right-0 h-full w-full border-l ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:translate-x-full',
  left:
    'inset-y-0 left-0 h-full w-full border-r ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:-translate-x-full',
  top:
    'inset-x-0 top-0 w-full border-b ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:-translate-y-full',
  bottom:
    'inset-x-0 bottom-0 w-full border-t ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:translate-y-full',
};

const HORIZONTAL_SIZE: Record<DrawerSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  full: '',
};

const VERTICAL_SIZE: Record<DrawerSize, string> = {
  sm: 'max-h-[40vh]',
  md: 'max-h-[60vh]',
  lg: 'max-h-[75vh]',
  xl: 'max-h-[85vh]',
  full: 'max-h-screen',
};

/**
 * Represents the prop surface of `DrawerContent`.
 *
 * React declared the surface axes by `extends SurfaceVariants`; they are
 * spelled out here because the SFC compiler's type resolver cannot follow a
 * `VariantProps<typeof …>` base and fails the build on it. The aliases below
 * are the canonical ones from `foundation/utils`, already locked against the
 * `surfaceVariants` config there, so the two cannot drift.
 */
export interface DrawerContentProps {
  /** The backdrop-hide toggle — disables the default backdrop when true. */
  hideBackdrop?: boolean;

  /** The backdrop-blur toggle. */
  isBlurred?: boolean;

  /** The per-side max-size token. Default `md`. */
  size?: DrawerSize;

  /** The visual recipe. Default `elevated`. */
  variant?: SurfaceVariant;

  /** The color tone the recipe is tinted with. */
  tone?: SurfaceTone;

  /** The corner rounding. Default `none`. */
  radius?: SurfaceRadius;

  /** The inner spacing step. Default `xl`. */
  padding?: SurfacePadding;

  /** The shadow depth. Default `3`. */
  elevation?: SurfaceElevation;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/utils';
import { DismissableLayer, FocusScope, Portal, Presence, ScrollLockProvider } from '../../../foundation/primitives';
import Backdrop from '../backdrop/Backdrop.vue';
import { overlayChromeContextKey } from '../OverlayChrome';
import { useDrawerContext } from './Drawer.vue';

/* The portalled edge panel — scrim, focus trap, scroll lock, and the sliding surface that carries the a11y contract. */
defineOptions({ name: 'DrawerContent', inheritAttrs: false });

/** The panel content — chrome subcomponents and the drawer body. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<DrawerContentProps>(), { size: 'md' });

const attrs = useAttrs();
const context = useDrawerContext();

/* Refs lifted to setup consts so the template auto-unwraps them (a plain injected object does not). */
const isOpen = context.open;
const side = context.side;
const dismissOnEscape = context.dismissOnEscape;

function close(): void {
  context.setOpen(false);
  requestAnimationFrame(() => context.triggerEl.value?.focus());
}

provide(overlayChromeContextKey, {
  titleId: context.titleId,
  descriptionId: context.descriptionId,
  close,
});

const isHorizontal = computed(() => side.value === 'right' || side.value === 'left');
const sizeClass = computed(() => (isHorizontal.value ? HORIZONTAL_SIZE[props.size] : VERTICAL_SIZE[props.size]));

const classes = computed(() =>
  cn(
    'fixed z-modal flex flex-col gap-4 outline-none',
    surfaceVariants({
      variant: props.variant ?? 'elevated',
      tone: props.tone,
      radius: props.radius ?? 'none',
      padding: props.padding ?? 'xl',
      elevation: props.elevation ?? 3,
    }),
    SIDE_BASE[side.value],
    sizeClass.value,
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/** The scrim's fade runs in lock-step with the slide — same token duration on both. */
const backdropClasses =
  'motion-safe:transition-opacity motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) data-[state=closed]:opacity-0';

function handleBackdropClick(): void {
  if (context.dismissOnOutsideClick.value) context.setOpen(false);
}

function handleEscape(): void {
  context.setOpen(false);
}
</script>

<template>
  <!--
    React nested `Portal` + `ScrollLockProvider` *inside* the Presence-cloned
    surface and forwarded the injected `ref` past them onto the panel with
    `forwardRef`. Vue resolves a cloned `ref` through `$el`, and a Teleport /
    renderless root has no element, so the portal and the lock are hoisted above
    `Presence` and the lock now follows open state rather than mount — the shape
    React's own `ModalContent` already used. Presence's cloned child is the panel
    itself, which is what has to carry `data-state` and the slide it times against.
  -->
  <Portal>
    <ScrollLockProvider :is-enabled="isOpen">
      <!-- The scrim runs on `Backdrop`'s own `Presence` (its `isOpen` prop); React
           mirrored the panel's `data-state` onto it by hand for the same effect. -->
      <Backdrop
        v-if="!props.hideBackdrop"
        is-inline
        :is-open="isOpen"
        :is-blurred="props.isBlurred"
        :class="backdropClasses"
        @click="handleBackdropClick"
      />
      <Presence :is-present="isOpen">
        <!--
          `FocusScope as-child` merges into `DismissableLayer`, whose own root div
          *is* the dialog panel — React kept the layer div and the panel div
          separate and forwarded `data-state` down to the inner one. Collapsing
          them keeps every attribute of React's panel (`role`, `aria-modal`,
          `aria-labelledby`, `aria-describedby`, `data-state`, `data-side`, the
          surface classes) on one node, which is also the node `Presence` clones
          and whose `transition-transform` end defers the unmount.
        -->
        <FocusScope as-child trapped loop>
          <DismissableLayer
            :is-escape-disabled="!dismissOnEscape"
            is-outside-click-disabled
            :on-escape="handleEscape"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="context.titleId"
            :aria-describedby="context.descriptionId"
            :data-side="side"
            v-bind="rest"
            :class="classes"
          >
            <slot />
          </DismissableLayer>
        </FocusScope>
      </Presence>
    </ScrollLockProvider>
  </Portal>
</template>
