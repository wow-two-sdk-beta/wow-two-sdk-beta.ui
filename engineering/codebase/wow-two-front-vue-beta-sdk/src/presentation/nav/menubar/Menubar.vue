<script lang="ts">
/**
 * The prop surface of `Menubar`.
 *
 * React declared `extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>`;
 * attributes reach the root through `useAttrs` here, which leaves the active-menu
 * value pair. React's `onValueChange` is the `value-change` emit.
 */
export interface MenubarProps {
  /** The id of the currently-open menu, or `null` if none. Controlled. */
  value?: string | null;

  /** The initially-open menu id when uncontrolled. Default `null`. */
  defaultValue?: string | null;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { RovingFocusGroup } from '../../../foundation/primitives';
import { menubarContextKey, type MenubarTriggerEntry } from './MenubarContext';
import { menubarVariants } from './Menubar.variants';

/** The application menu bar — a single composite tab stop holding one menu open at a time. */
defineOptions({ name: 'Menubar', inheritAttrs: false });

/** The `MenubarMenu` children — React's `children`. */
defineSlots<{ default(): unknown }>();

/** `value` defaults to `undefined` — the tri-state that separates "controlled to null" from "uncontrolled". */
const props = withDefaults(defineProps<MenubarProps>(), {
  value: undefined,
  defaultValue: null,
});

const emit = defineEmits<{
  /** Replaces React's `onValueChange` — fires with the newly-open menu id, or `null`. */
  'value-change': [value: string | null];
}>();

const attrs = useAttrs();
const el = useTemplateRef<InstanceType<typeof RovingFocusGroup>>('el');

const { value: activeId, setValue: setActiveId } = useControlled<string | null>({
  controlled: () => props.value,
  default: () => props.defaultValue,
  onChange: (next) => emit('value-change', next),
});

/** Plain array, not reactive — the ordering is read imperatively, exactly as React's `useRef` list was. */
const triggers: Array<MenubarTriggerEntry> = [];

function registerTrigger(id: string, triggerEl: HTMLButtonElement | null): void {
  const index = triggers.findIndex((t) => t.id === id);
  if (index >= 0) triggers[index] = { id, el: triggerEl };
  else triggers.push({ id, el: triggerEl });
}

function unregisterTrigger(id: string): void {
  const index = triggers.findIndex((t) => t.id === id);
  if (index >= 0) triggers.splice(index, 1);
}

function moveAcross(fromId: string, direction: 1 | -1): void {
  const index = triggers.findIndex((t) => t.id === fromId);
  if (index === -1) return;
  let nextIndex = index + direction;
  if (nextIndex < 0) nextIndex = triggers.length - 1;
  if (nextIndex >= triggers.length) nextIndex = 0;
  const next = triggers[nextIndex];
  if (!next) return;
  next.el?.focus();
  // If a menu is already open, switch the open menu to follow focus.
  if (activeId.value !== null) setActiveId(next.id);
}

provide(menubarContextKey, {
  activeId,
  setActiveId,
  registerTrigger,
  unregisterTrigger,
  moveAcross,
});

const classes = computed(() => cn(menubarVariants(), attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Roving tabindex (APG): the menubar is a single composite tab stop — one
       trigger holds tabindex 0, arrows / Home / End rove focus. `role` falls
       through and replaces the primitive's own `role="group"`. -->
  <RovingFocusGroup ref="el" orientation="horizontal" can-loop role="menubar" v-bind="rest" :class="classes">
    <slot />
  </RovingFocusGroup>
</template>
