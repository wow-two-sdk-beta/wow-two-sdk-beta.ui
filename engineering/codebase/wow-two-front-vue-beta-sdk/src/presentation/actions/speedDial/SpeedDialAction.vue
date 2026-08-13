<script lang="ts">
import type { ButtonHTMLAttributes, VNodeChild } from 'vue';

/* The required accessible label rides on the ignored heritage rather than the body — action items
   are icon-only, so the name is mandatory, but it must reach the DOM as an attribute. */
type SpeedDialActionAttributes = Omit<ButtonHTMLAttributes, 'children'> & { 'aria-label': string };

/* Native button attributes stay in attribute fallthrough rather than becoming runtime props. */
export interface SpeedDialActionProps extends /* @vue-ignore */ SpeedDialActionAttributes {
  /** The action's glyph. Prefer the `icon` named slot; this prop stays for parity with the React API. */
  icon?: VNodeChild;

  /** The label chip rendered beside the button. Prefer the `tooltip` named slot. */
  tooltip?: VNodeChild;

  /** The button type. Default `ButtonType.Button`. */
  type?: ButtonType;
}
</script>

<script setup lang="ts">
import { computed, defineComponent, useAttrs, useSlots, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { ButtonType, cn, Side } from '../../../foundation/utils';
import { SpeedDialDirection, useSpeedDialContext } from './SpeedDialContext';

/* `aria-label` is deliberately NOT a declared prop: Vue camelizes prop keys, so a declared
   `'aria-label'` would arrive as `props.ariaLabel` and never render. It stays a fallthrough attr;
   the interface keeps the requirement through the `@vue-ignore`d heritage. */
defineOptions({ name: 'SpeedDialAction', inheritAttrs: false });

const props = withDefaults(defineProps<SpeedDialActionProps>(), {
  type: ButtonType.Button,
  /* `VNodeChild` includes `boolean`, so Vue's boolean casting turns an absent node-valued prop
     into `false` rather than `undefined` — which reads as "supplied" at every `!== undefined`
     check. An explicit `undefined` default suppresses the cast. */
  icon: undefined,
  tooltip: undefined,
});

const emit = defineEmits<{
  /** Fires when the action is chosen — the dial closes and focus returns to the trigger afterwards. */
  select: [];
}>();

const attrs = useAttrs();
const slots = useSlots();
const context = useSpeedDialContext();

const DIRECTION_LABEL_SIDE: Record<SpeedDialDirection, Side> = {
  [SpeedDialDirection.Up]: Side.Right,
  [SpeedDialDirection.Down]: Side.Right,
  [SpeedDialDirection.Left]: Side.Right,
  [SpeedDialDirection.Right]: Side.Left,
};

/* Stable render-only wrappers for the node-valued props, so each can render as the fallback of its
   named-slot twin. */
const IconProp = defineComponent({ render: () => props.icon });
const TooltipProp = defineComponent({ render: () => props.tooltip });

const labelSide = computed(() => DIRECTION_LABEL_SIDE[context.direction]);
const hasTooltip = computed(() => props.tooltip !== undefined || slots.tooltip !== undefined);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const buttonClass = computed(() =>
  cn(
    'inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-card-foreground shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    attrs.class as ClassValue,
  ),
);

/* Chained after the consumer's own click (attribute fallthrough puts theirs first) and skipped
   when they called `preventDefault()` — the original's `onClick?.(e); if (e.defaultPrevented) return`. */
function handleClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;
  emit('select');
  context.setOpen(false);
  requestAnimationFrame(() => context.triggerEl.value?.focus());
}

const root = useTemplateRef<HTMLButtonElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <li
    role="none"
    :data-side="labelSide"
    :class="
      cn(
        'flex items-center gap-2',
        /* fade+scale each action off the list's `group` state; motion-safe so
           reduced-motion users get no movement (delay ramp lives on the list). */
        'motion-safe:group-data-[state=open]:animate-(--animate-pop-in)',
        'motion-safe:group-data-[state=closed]:animate-(--animate-pop-out)',
        'motion-reduce:animate-none',
      )
    "
  >
    <span
      v-if="hasTooltip && labelSide === Side.Left"
      class="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
    >
      <slot name="tooltip"><TooltipProp v-if="tooltip !== undefined" /></slot>
    </span>
    <button
      ref="root"
      v-bind="passthroughAttrs"
      :type="type"
      role="menuitem"
      :class="buttonClass"
      @click="handleClick"
    >
      <slot name="icon"><IconProp v-if="icon !== undefined" /></slot>
    </button>
    <span
      v-if="hasTooltip && labelSide === Side.Right"
      class="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
    >
      <slot name="tooltip"><TooltipProp v-if="tooltip !== undefined" /></slot>
    </span>
  </li>
</template>
