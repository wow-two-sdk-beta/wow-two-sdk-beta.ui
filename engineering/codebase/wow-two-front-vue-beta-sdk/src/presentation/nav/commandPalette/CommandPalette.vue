<script lang="ts">
/**
 * The prop surface of `CommandPalette`.
 *
 * `open` and `isOpen` are the same controlled state under two names: `open` is
 * the `v-model:open` binding target and React's own spelling, `isOpen` the house
 * boolean spelling. `open` wins when both are set. React's `onOpenChange` is the
 * `open-change` emit; `update:open` fires alongside it so `v-model:open` works,
 * and `update:inputValue` does the same for the search text.
 */
export interface CommandPaletteProps {
  /** The open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The open state, controlled — the house spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;

  /** The search text, controlled. The `v-model:input-value` binding target. */
  inputValue?: string;

  /** The initial search text when uncontrolled. Default `''`. */
  defaultInputValue?: string;

  /** The key that opens the palette with ⌘/Ctrl. Omit to bind no global shortcut. */
  triggerKey?: string;

  /** The match predicate. Default case-insensitive substring. */
  filter?: (searchText: string, search: string) => boolean;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef, watch } from 'vue';
import { useControlled, useId } from '../../../foundation/hooks';
import { useHotkeys } from '../../../foundation/shortcuts';
import { Modal } from '../../overlays/modal';
import { commandPaletteContextKey, defaultFilter, type CommandItemEntry } from './CommandPaletteContext';

/**
 * State owner for a CommandPalette tree — owns open state, search text and the
 * item registry, and renders the whole thing inside a `Modal`.
 */
defineOptions({ name: 'CommandPalette', inheritAttrs: false });

/** The palette tree — `CommandPaletteContent` and its parts. React's `children`. */
defineSlots<{ default(): unknown }>();

/** `open` / `isOpen` default to `undefined` so an absent prop cannot read as an explicit `false`. */
const props = withDefaults(defineProps<CommandPaletteProps>(), {
  open: undefined,
  isOpen: undefined,
  defaultOpen: false,
  inputValue: undefined,
  defaultInputValue: undefined,
  triggerKey: undefined,
  filter: defaultFilter,
});

const emit = defineEmits<{
  /** The `v-model:open` half. */
  'update:open': [open: boolean];

  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];

  /** The `v-model:input-value` half. */
  'update:inputValue': [input: string];

  /** Replaces React's `onInputChange`. */
  'input-change': [input: string];
}>();

const openState = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (value) => {
    emit('update:open', value);
    emit('open-change', value);
  },
});

const inputState = useControlled<string>({
  controlled: () => props.inputValue,
  default: () => props.defaultInputValue ?? '',
  onChange: (value) => {
    emit('update:inputValue', value);
    emit('input-change', value);
  },
});

const items = shallowRef<ReadonlyArray<CommandItemEntry>>([]);
const activeId = shallowRef<string | null>(null);
const inputEl = shallowRef<HTMLInputElement | null>(null);
const inputId = useId();
const listboxId = useId();

function registerItem(entry: CommandItemEntry): void {
  const next = items.value.slice();
  const index = next.findIndex((i) => i.id === entry.id);
  if (index >= 0) next[index] = entry;
  else next.push(entry);
  items.value = next;
}

function unregisterItem(id: string): void {
  items.value = items.value.filter((i) => i.id !== id);
}

/* Global keybinding (cmd-/ctrl-K). `mod` = ⌘ on Apple / Ctrl elsewhere; the explicit `ctrl+`/`meta+` pair keeps
   the spec's "we accept both on every platform" contract. The chord must always parse (`+` is the token
   separator → `plus`; a falsy `triggerKey` needs a placeholder), so `enabled` — not an early return — unbinds. */
const chordKey = computed(() => {
  const key = props.triggerKey;
  return !key ? 'k' : key === '+' ? 'plus' : key;
});

useHotkeys(
  () => [`mod+${chordKey.value}`, `ctrl+${chordKey.value}`, `meta+${chordKey.value}`],
  () => openState.setValue(true),
  { enabled: () => Boolean(props.triggerKey) },
);

// Reset the active id on close.
watch(
  () => openState.value.value,
  (isOpen) => {
    if (!isOpen) activeId.value = null;
  },
  { flush: 'post' },
);

provide(commandPaletteContextKey, {
  open: openState.value,
  setOpen: openState.setValue,
  inputValue: inputState.value,
  setInputValue: inputState.setValue,
  activeId,
  setActiveId: (id: string | null) => {
    activeId.value = id;
  },
  items,
  registerItem,
  unregisterItem,
  /* Wrapped rather than stored, so a `filter` prop change is picked up live —
     React re-created the whole context value for the same effect. */
  filter: (searchText: string, search: string) => props.filter(searchText, search),
  inputId,
  listboxId,
  inputEl,
});

/* Lifted to a setup const so the template auto-unwraps it. Named `resolvedOpen`
   rather than `isOpen` — that name is already a declared prop here. */
const resolvedOpen = openState.value;
</script>

<template>
  <Modal :open="resolvedOpen" @open-change="openState.setValue"><slot /></Modal>
</template>
