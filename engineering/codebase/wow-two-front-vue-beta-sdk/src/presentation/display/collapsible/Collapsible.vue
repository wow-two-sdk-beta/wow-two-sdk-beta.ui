<script lang="ts">
/**
 * `open` and `isOpen` are the same controlled state under two names: `open` is
 * React's own spelling and the `v-model:open` binding target, `isOpen` the house
 * boolean spelling that mirrors the rest of the port. `open` wins when both are
 * set. React's `onOpenChange` is the `open-change` emit; `update:open` fires
 * alongside it so `v-model:open` works. Same pairing as `overlays/modal`.
 */
export interface CollapsibleProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The uncontrolled initial state. Default `false`. */
  defaultOpen?: boolean;

  /** The disabled mode — the trigger stops toggling. Default `false`. */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn, dataAttr } from '../../../foundation/utils';
import { useControlled, useId } from '../../../foundation/hooks';
import { CollapsibleKey } from './CollapsibleContext';

/**
 * Disclosure root — owns the open state and the trigger/content id pair, and
 * publishes both to `CollapsibleTrigger` / `CollapsibleContent`.
 */
defineOptions({ name: 'Collapsible', inheritAttrs: false });

/** The trigger + content — React's `children`. */
defineSlots<{ default(): unknown }>();

/* `open: undefined` / `isOpen: undefined` are load-bearing: Vue coerces an absent
   `Boolean` prop to `false` unless the declaration owns a `default` key, which would
   read as explicitly-closed-and-controlled and strand the uncontrolled path. */
const props = withDefaults(defineProps<CollapsibleProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  isDisabled: false,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Emits the open state whenever it changes — React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

/* `useControlled` returns a handle, not React's tuple, and takes `controlled` as a getter so the
   controlled branch tracks the prop. */
const { value: open, setValue: setOpen } = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: props.defaultOpen,
  onChange: (next) => {
    emit('update:open', next);
    emit('open-change', next);
  },
});

const contentId = useId();
const triggerId = useId();

provide(CollapsibleKey, {
  get open() {
    return open.value;
  },
  setOpen,
  contentId,
  triggerId,
  get disabled() {
    return props.isDisabled;
  },
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() => cn(attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Own attrs first, `v-bind="rest"` after — a consumer-supplied `data-state` still wins, as it
       did through React's trailing `{...rest}` spread. -->
  <div
    ref="el"
    :data-state="open ? 'open' : 'closed'"
    :data-disabled="dataAttr(props.isDisabled)"
    v-bind="rest"
    :class="classes"
  >
    <slot />
  </div>
</template>
