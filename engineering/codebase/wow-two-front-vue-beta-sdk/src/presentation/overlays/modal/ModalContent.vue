<script lang="ts">
import type {
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/utils';

/**
 * Represents the prop surface of `ModalContent`.
 *
 * React declared the surface axes by `extends SurfaceVariants`; they are
 * spelled out here because the SFC compiler's type resolver cannot follow a
 * `VariantProps<typeof …>` base and fails the build on it. The aliases below
 * are the canonical ones from `foundation/utils`, already locked against the
 * `surfaceVariants` config there, so the two cannot drift.
 */
export interface ModalContentProps {
  /** The backdrop-hide toggle — disables the default backdrop when true. */
  hideBackdrop?: boolean;

  /** The backdrop-blur toggle. */
  isBlurred?: boolean;

  /** The visual recipe. Default `elevated`. */
  variant?: SurfaceVariant;

  /** The color tone the recipe is tinted with. */
  tone?: SurfaceTone;

  /** The corner rounding. Default `lg`. */
  radius?: SurfaceRadius;

  /** The inner spacing step. Default `xl`. */
  padding?: SurfacePadding;

  /** The shadow depth. */
  elevation?: SurfaceElevation;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn, surfaceVariants } from '../../../foundation/utils';
import { DismissableLayer, FocusScope, Portal, Presence, ScrollLockProvider } from '../../../foundation/primitives';
import Backdrop from '../backdrop/Backdrop.vue';
import { overlayChromeContextKey } from '../OverlayChrome';
import { useModalContext } from './Modal.vue';

/* The portalled dialog surface — scrim, focus trap, scroll lock, and the panel that carries the a11y contract. */
defineOptions({ name: 'ModalContent', inheritAttrs: false });

/** The panel content — chrome subcomponents and the dialog body. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<ModalContentProps>();

const attrs = useAttrs();
const context = useModalContext();
const el = useTemplateRef<HTMLDivElement>('el');

/* Refs lifted to setup consts so the template auto-unwraps them (a plain injected object does not). */
const isOpen = context.open;
const role = context.role;
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

const classes = computed(() =>
  cn(
    'relative w-full max-w-lg',
    'motion-safe:group-data-[state=open]:animate-(--animate-pop-in)',
    'motion-safe:group-data-[state=closed]:animate-(--animate-pop-out)',
    surfaceVariants({
      variant: props.variant ?? 'elevated',
      tone: props.tone,
      radius: props.radius ?? 'lg',
      padding: props.padding ?? 'xl',
      elevation: props.elevation,
    }),
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/** Outside-click dismissal — `.self` is React's `e.target !== e.currentTarget` guard. */
function handleOutsideClick(): void {
  if (context.dismissOnOutsideClick.value) context.setOpen(false);
}

function handleEscape(): void {
  context.setOpen(false);
}

defineExpose({ el });
</script>

<template>
  <Portal>
    <!-- Lock follows open state, not mount — Content can mount closed. -->
    <ScrollLockProvider :is-enabled="isOpen">
      <!-- The scrim runs on `Backdrop`'s own `Presence` (its `isOpen` prop) so the
           fade-out plays before it unmounts. React wrapped it in a second, outer
           `Presence`, whose injected `data-state` the inner one then overwrote —
           passing the state straight in is the same intent without the masking. -->
      <Backdrop v-if="!props.hideBackdrop" is-inline :is-open="isOpen" :is-blurred="props.isBlurred" />
      <!-- Outside-click dismissal lives on the centering wrapper (it covers the
           backdrop): a click on the padding (`.self`) = outside. The wrapper is the
           Presence-animated node — `Presence` injects `data-state` + `ref` onto it and
           watches *its own* animations (no subtree walk), so the wrapper carries a
           (transparent) fade and the visible pop lands on the panel via
           `group-data-[state=*]`. Both share the same token timing, so the wrapper fade
           gates unmount correctly. -->
      <Presence :is-present="isOpen">
        <div
          :class="
            cn(
              'group fixed inset-0 z-modal grid place-items-center overflow-y-auto p-4',
              'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
              'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
            )
          "
          @click.self="handleOutsideClick"
        >
          <FocusScope as-child trapped loop>
            <DismissableLayer
              :is-escape-disabled="!dismissOnEscape"
              is-outside-click-disabled
              :on-escape="handleEscape"
            >
              <div
                ref="el"
                :role="role"
                aria-modal="true"
                :aria-labelledby="context.titleId"
                :aria-describedby="context.descriptionId"
                v-bind="rest"
                :class="classes"
              >
                <slot />
              </div>
            </DismissableLayer>
          </FocusScope>
        </div>
      </Presence>
    </ScrollLockProvider>
  </Portal>
</template>
