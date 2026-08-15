<script lang="ts">
import type { Placement } from '@floating-ui/vue';
import type { EqualityComparer } from '../../../foundation/utils';
import type { SelectOption } from './SelectContext';

/** Represents the prop surface of the `Select` root. */
export interface SelectProps<K, V = K> {
  /** The selected key, controlled. The `v-model` binding target. `null` = explicit clear, `undefined` = uncontrolled. */
  modelValue?: K | null;

  /** The selected key, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: K | null;

  /** The initial selected key for uncontrolled use. */
  defaultValue?: K | null;

  /** The equality comparer for keys; defaults to `Equality.strictEquals`. */
  keyEquals?: EqualityComparer<K>;

  /** The disabled state, blocking interaction when true. */
  isDisabled?: boolean;

  /** The loading state, showing a spinner in the trigger and blocking interaction. */
  isLoading?: boolean;

  /** The label for the loading state on the polite live region + in-list row; defaults to `'Loading options…'`. */
  loadingLabel?: string;

  /** The clearable state, rendering a clear (×) button in the trigger when a value is set. */
  isClearable?: boolean;

  /** The label for the clear (×) button for assistive tech; defaults to `'Clear selection'`. */
  clearLabel?: string;

  /** The name of the hidden form input that ships the serialized key. */
  name?: string;

  /** The key serializer for the hidden form input; defaults to `String(key)`. */
  serializeKey?: (key: K) => string;

  /** The label resolver for a `value`/`defaultValue` before items register
   *  (the trigger otherwise shows the raw serialized key until the first open). */
  getOptionLabel?: (key: K) => string | number | null;

  /** The option set seeded eagerly into the item registry + label cache on mount — before the
   *  popover ever opens. Lets `SelectValue` resolve the selected label and closed-trigger
   *  typeahead work without a first open, so `getOptionLabel` is unnecessary. Compound
   *  `<SelectItem>` children still render the list and remain fully supported; `options` is an
   *  alternative/supplement. When both supply the same key, the mounted child wins (deduped via
   *  `keyEquals`). Each entry mirrors what a `SelectItem` registers. */
  options?: ReadonlyArray<SelectOption<K, V>>;

  /** The invalid state, styling the trigger as invalid (red border, error ring). */
  isInvalid?: boolean;

  /** The initial open state of the dropdown when uncontrolled. */
  defaultOpen?: boolean;

  /** The dropdown open state, controlled. The `v-model:open` binding target. */
  open?: boolean;

  /** The dropdown open state, controlled — the house boolean spelling of `open`; `open` wins when both are set. */
  isOpen?: boolean;

  /** The floating placement of the dropdown. */
  placement?: Placement;
}
</script>

<script setup lang="ts" generic="K, V = K">
import { computed, provide, ref, shallowRef, watch } from 'vue';
import { Equality } from '../../../foundation/utils';
import { useControlled, useId } from '../../../foundation/hooks';
import { Popover } from '../../overlays';
import { extractText, selectContextKey, type ItemRegistryEntry, type SelectContextValue } from './SelectContext';
import { useFormControl } from '../../../foundation/primitives';

/**
 * State + a11y-id owner for a Select tree. Renders the `Popover` that hosts the
 * trigger and the panel, plus the hidden form input carrying the serialized key.
 *
 * Inherits id/disabled/required/invalid/describedby from a surrounding `<Field>`;
 * standalone props win when provided, context fills the gaps.
 */
defineOptions({ name: 'Select', inheritAttrs: false });

/** The Select tree — `SelectTrigger` and `SelectContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<SelectProps<K, V>>(), {
  isLoading: false,
  loadingLabel: 'Loading options…',
  isClearable: false,
  clearLabel: 'Clear selection',
  defaultOpen: false,
  placement: 'bottom',
  /* Explicit `undefined` defaults are load-bearing: `useControlled` keys on `=== undefined`,
     and Vue casts an absent `boolean` prop to `false`. Without these, `open`/`isOpen` would
     read as "controlled, and closed" — pinning the dropdown shut and making `defaultOpen`
     dead — and `isDisabled`/`isInvalid` would shadow the surrounding `<Field>` context. */
  open: undefined,
  isOpen: undefined,
  isDisabled: undefined,
  isInvalid: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half — carries the selected KEY, `null` on clear. */
  'update:modelValue': [key: K | null];
  /** Replaces React's `onValueChange`. Carries the full option, `null` on clear. */
  'value-change': [option: SelectOption<K, V> | null];
  /** The `v-model:open` half. */
  'update:open': [open: boolean];
  /** Replaces React's `onOpenChange`. */
  'open-change': [open: boolean];
}>();

/* `field` is a live-getter object — read fields off it, never destructure. */
const field = useFormControl();

const finalDisabled = computed(() => props.isDisabled ?? field?.isDisabled ?? false);
const finalInvalid = computed(() => props.isInvalid ?? field?.isInvalid ?? false);

const openCtl = useControlled<boolean>({
  controlled: () => (props.open !== undefined ? props.open : props.isOpen),
  default: () => props.defaultOpen,
  onChange: (value) => {
    emit('update:open', value);
    emit('open-change', value);
  },
});

const keyCtl = useControlled<K | null>({
  controlled: () => (props.value !== undefined ? props.value : props.modelValue),
  default: () => props.defaultValue ?? null,
  onChange: (value) => emit('update:modelValue', value),
});

/* Reactive, unlike Listbox's plain array: `SelectValue` resolves its label from this set and
   `SelectContent` counts visible rows off it, both at render time. */
const items = ref<ItemRegistryEntry[]>([]);

/* Persistent key→label cache (keyed by serialized key), never evicted on unmount: backstops
   label resolution for a closed trigger after items unmount, separate from the live `items` set.
   Deliberately a plain Map, matching React's ref — every read of it is reached through a chain
   that already depends on `items`, which is what changes when an option unmounts. */
const labelCache = new Map<string, string | number>();

const query = ref('');
const activeDescendant = ref<string | null>(null);
const listboxId = useId('select-listbox');
const listboxEl = shallowRef<HTMLElement | null>(null);

/* Captures `{ itemKey, label }` at selection time — items unmount on popover close, so the
   registry alone can't label the trigger before the first open. */
const selectedEntry = shallowRef<{ itemKey: unknown; label: string | number } | null>(null);

const keyEqualsFn = computed<EqualityComparer<unknown>>(
  () => (props.keyEquals as EqualityComparer<unknown> | undefined) ?? Equality.strictEquals,
);

const serializeKeyFn = computed<(key: unknown) => string>(
  () => (props.serializeKey as ((key: unknown) => string) | undefined) ?? ((key) => String(key)),
);

function getOptionLabelFn(key: unknown): string | number | null {
  const fn = props.getOptionLabel as ((key: unknown) => string | number | null) | undefined;
  return fn ? fn(key) : null;
}

function registerItem(entry: ItemRegistryEntry): void {
  /* Persist the label so a closed trigger can still resolve it after this item unmounts. */
  labelCache.set(serializeKeyFn.value(entry.itemKey), entry.label);
  const list = items.value;
  const idx = list.findIndex((i) => Object.is(i.itemKey, entry.itemKey));
  if (idx >= 0) {
    const existing = list[idx];
    if (
      existing &&
      existing.label === entry.label &&
      existing.text === entry.text &&
      existing.isDisabled === entry.isDisabled &&
      Object.is(existing.value, entry.value)
    ) {
      return;
    }
    const next = list.slice();
    next[idx] = entry;
    items.value = next;
    return;
  }
  items.value = [...list, entry];
}

/* Drops the item from the live mounted set on unmount so a removed option (popover close OR
   option-set change) no longer satisfies search / typeahead / value resolution. The label
   stays in `labelCache`, so the trigger keeps its label after close. */
function unregisterItem(itemKey: unknown): void {
  const idx = items.value.findIndex((i) => Object.is(i.itemKey, itemKey));
  if (idx === -1) return;
  const next = items.value.slice();
  next.splice(idx, 1);
  items.value = next;
}

function getCachedLabel(key: unknown): string | number | undefined {
  return labelCache.get(serializeKeyFn.value(key));
}

/* Maps the eager `options` prop to registry entries, mirroring what a `SelectItem` registers.
   Seeding these lets `SelectValue` + closed-trigger typeahead resolve before the popover's
   first open, so `getOptionLabel` is unnecessary when `options` is supplied. */
const seedItems = computed<ItemRegistryEntry[]>(() => {
  if (!props.options) return [];
  return props.options.map((option) => ({
    itemKey: option.itemKey,
    value: (option.value ?? option.itemKey) as unknown,
    label: option.label,
    text: extractText(option.label),
    isDisabled: option.isDisabled ?? false,
  }));
});

/* Merges seeded options with the live (compound-child) registrations, deduped by `keyEquals`.
   A mounted `<SelectItem>` wins on key collision — its value/label/text supersede the seed —
   while compound-only items append. Seed order is preserved so closed-trigger typeahead follows
   `options`. When no options are given this is exactly the live `items` set (no behavior change). */
const mergedItems = computed<ItemRegistryEntry[]>(() => {
  const seeds = seedItems.value;
  const live = items.value;
  if (seeds.length === 0) return live;
  if (live.length === 0) return seeds;
  const equals = keyEqualsFn.value;
  const merged = seeds.map((s) => live.find((i) => equals(i.itemKey, s.itemKey)) ?? s);
  const extras = live.filter((i) => !seeds.some((s) => equals(s.itemKey, i.itemKey)));
  return extras.length > 0 ? [...merged, ...extras] : merged;
});

/* Seeds the persistent label cache from `options` so a controlled value resolves its label
   before any item mounts. Only fills gaps — a mounted `SelectItem` (via `registerItem`) writes
   the cache unconditionally and therefore always wins. */
watch(
  seedItems,
  (seeds) => {
    if (seeds.length === 0) return;
    for (const seed of seeds) {
      const serialized = serializeKeyFn.value(seed.itemKey);
      if (!labelCache.has(serialized)) labelCache.set(serialized, seed.label);
    }
  },
  { immediate: true },
);

const hasSelection = computed(() => keyCtl.value.value !== null && keyCtl.value.value !== undefined);

/* Drops the captured label when the key changed externally (controlled updates). */
const selectedLabel = computed<string | number | null>(() => {
  const captured = selectedEntry.value;
  if (!captured || !hasSelection.value) return null;
  return keyEqualsFn.value(captured.itemKey, keyCtl.value.value) ? captured.label : null;
});

function onSelect(entry: ItemRegistryEntry): void {
  keyCtl.setValue(entry.itemKey as K | null);
  selectedEntry.value = { itemKey: entry.itemKey, label: entry.label };
  openCtl.setValue(false);
  query.value = '';
  emit('value-change', {
    itemKey: entry.itemKey as K,
    value: entry.value as V,
    label: entry.label,
  });
}

function onClear(): void {
  keyCtl.setValue(null);
  selectedEntry.value = null;
  emit('value-change', null);
}

function onPopoverOpenChange(next: boolean): void {
  openCtl.setValue(next);
  if (!next) {
    query.value = '';
    activeDescendant.value = null;
  }
}

const context: SelectContextValue = {
  get open() {
    return openCtl.value.value;
  },
  setOpen: (next) => openCtl.setValue(next),
  get selectedKey() {
    return keyCtl.value.value;
  },
  get hasSelection() {
    return hasSelection.value;
  },
  get selectedLabel() {
    return selectedLabel.value;
  },
  onSelect,
  onClear,
  get keyEquals() {
    return keyEqualsFn.value;
  },
  get items() {
    return mergedItems.value;
  },
  registerItem,
  unregisterItem,
  getCachedLabel,
  get query() {
    return query.value;
  },
  setQuery: (next) => {
    query.value = next;
  },
  get isDisabled() {
    return finalDisabled.value;
  },
  get isLoading() {
    return props.isLoading;
  },
  get loadingLabel() {
    return props.loadingLabel;
  },
  get isClearable() {
    return props.isClearable;
  },
  get clearLabel() {
    return props.clearLabel;
  },
  get serializeKey() {
    return serializeKeyFn.value;
  },
  getOptionLabel: getOptionLabelFn,
  get name() {
    return props.name;
  },
  get isInvalid() {
    return finalInvalid.value;
  },
  get listboxId() {
    return listboxId;
  },
  get activeDescendant() {
    return activeDescendant.value;
  },
  setActiveDescendant: (id) => {
    activeDescendant.value = id;
  },
  listboxEl,
  get fieldId() {
    return field?.id;
  },
  get labelId() {
    return field?.labelledBy;
  },
  get describedBy() {
    return field?.describedBy;
  },
};

provide(selectContextKey, context);

const isOpenNow = computed(() => openCtl.value.value);
const serializedKey = computed(() => serializeKeyFn.value(keyCtl.value.value));
</script>

<template>
  <Popover :open="isOpenNow" :placement="placement" :offset="4" @open-change="onPopoverOpenChange">
    <slot />
    <!-- Always-rendered — inside PopoverContent it would vanish from form submission when closed. -->
    <input v-if="name && hasSelection" type="hidden" :name="name" :value="serializedKey" />
  </Popover>
</template>
