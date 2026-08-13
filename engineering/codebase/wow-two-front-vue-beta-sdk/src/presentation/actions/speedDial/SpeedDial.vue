<script lang="ts">
import type { SpeedDialDirection, SpeedDialPosition } from './SpeedDialContext';

export interface SpeedDialProps {
  /** The viewport anchor. Default `bottom-right`. */
  position?: SpeedDialPosition;

  /** The axis the action items fan out along. Defaults to the one implied by `position`. */
  direction?: SpeedDialDirection;

  /** The controlled open state. */
  isOpen?: boolean;

  /** The uncontrolled initial state. */
  defaultOpen?: boolean;

  /** The pixel gap between stacked action items. Default 12. */
  gap?: number;
}
</script>

<script setup lang="ts">
import {
  computed,
  provide,
  shallowRef,
  useAttrs,
  useSlots,
  useTemplateRef,
  type VNode,
} from 'vue';
import type { ClassValue } from 'clsx';
import { cn, Key, OverlayPosition } from '../../../foundation/utils';
import { Presence, renderableChildren } from '../../../foundation/primitives';
import { useControlled, useEscape, useOutsideClick } from '../../../foundation/hooks';
import {
  SpeedDialDirection as SpeedDialDirectionValue,
  SpeedDialKey,
} from './SpeedDialContext';
import SpeedDialList from './SpeedDialList.vue';
import SpeedDialTrigger from './SpeedDialTrigger.vue';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'SpeedDial', inheritAttrs: false });

/* `className` is Vue's `class` fallthrough attr; `children` is the default slot. */
const props = withDefaults(defineProps<SpeedDialProps>(), {
  position: OverlayPosition.BottomRight,
  direction: undefined,
  gap: 12,
  defaultOpen: false,
  isOpen: undefined,
});

const emit = defineEmits<{
  /** Emits the open state whenever it changes. */
  'open-change': [open: boolean];
}>();

const attrs = useAttrs();
const slots = useSlots();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const POSITION_TO_DIRECTION: Record<SpeedDialPosition, SpeedDialDirection> = {
  'bottom-right': SpeedDialDirectionValue.Up,
  'bottom-left': SpeedDialDirectionValue.Up,
  'bottom-center': SpeedDialDirectionValue.Up,
  'top-right': SpeedDialDirectionValue.Down,
  'top-left': SpeedDialDirectionValue.Down,
  'top-center': SpeedDialDirectionValue.Down,
};

const POSITION_OFFSETS: Record<SpeedDialPosition, string> = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
  'top-center': 'top-6 left-1/2 -translate-x-1/2',
};

const DIRECTION_TO_STACK: Record<SpeedDialDirection, string> = {
  [SpeedDialDirectionValue.Up]: 'flex-col-reverse bottom-full mb-3',
  [SpeedDialDirectionValue.Down]: 'flex-col top-full mt-3',
  [SpeedDialDirectionValue.Left]: 'flex-row-reverse right-full mr-3',
  [SpeedDialDirectionValue.Right]: 'flex-row top-1/2 -translate-y-1/2 left-full ml-3',
};

const { value: open, setValue: setOpen } = useControlled<boolean>({
  controlled: () => props.isOpen,
  default: props.defaultOpen,
  onChange: (next) => emit('open-change', next),
});

const rootEl = useTemplateRef<HTMLDivElement>('rootEl');
const triggerEl = shallowRef<HTMLElement | null>(null);

const resolvedDirection = computed(
  () => props.direction ?? POSITION_TO_DIRECTION[props.position],
);

useEscape(() => {
  setOpen(false);
  requestAnimationFrame(() => triggerEl.value?.focus());
}, open);

useOutsideClick(
  rootEl,
  () => {
    if (open.value) setOpen(false);
  },
  open,
);

provide(SpeedDialKey, {
  get open() {
    return open.value;
  },
  setOpen,
  triggerEl,
  get direction() {
    return resolvedDirection.value;
  },
  get position() {
    return props.position;
  },
});

/* The trigger renders always (a closed dial must still be openable); only the action items are
   gated behind `open`. The React original partitioned `Children.toArray` on `child.type`; the
   same split runs over the slot's vnodes, so the authoring shape is unchanged. */
function splitChildren(keepTrigger: boolean): Array<VNode> {
  return renderableChildren(slots.default?.()).filter(
    (child) => (child.type === SpeedDialTrigger) === keepTrigger,
  );
}

const rootClass = computed(() =>
  cn('fixed', POSITION_OFFSETS[props.position], attrs.class as ClassValue),
);
const stackClass = computed(() => DIRECTION_TO_STACK[resolvedDirection.value]);

function handleKeydown(event: KeyboardEvent): void {
  if (!open.value || (event.key !== Key.ArrowDown && event.key !== Key.ArrowUp)) return;
  const root = rootEl.value;
  if (!root) return;
  const items = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
  if (items.length === 0) return;
  event.preventDefault();
  const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
  const nextIndex =
    currentIndex === -1
      ? event.key === Key.ArrowDown
        ? 0
        : items.length - 1
      : (currentIndex + (event.key === Key.ArrowDown ? 1 : -1) + items.length) % items.length;
  items[nextIndex]?.focus();
}

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: rootEl });
</script>

<template>
  <div
    ref="rootEl"
    :data-state="open ? 'open' : 'closed'"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @keydown="handleKeydown"
  >
    <!-- `Presence` clones `data-state` ("open" | "closed") + a `ref` onto the list and defers
         unmount until its fade-out ends — keeps the exit from being killed by the hard `!open`
         unmount. Items pop in/out off the list's `group` state (see `SpeedDialAction`),
         staggered on enter. -->
    <Presence :is-present="open">
      <SpeedDialList
        :data-direction="resolvedDirection"
        :style="{ gap: `${gap}px` }"
        :class="stackClass"
      >
        <component :is="node" v-for="(node, index) in splitChildren(false)" :key="index" />
      </SpeedDialList>
    </Presence>
    <component :is="node" v-for="(node, index) in splitChildren(true)" :key="index" />
  </div>
</template>
