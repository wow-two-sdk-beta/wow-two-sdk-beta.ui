<script lang="ts">
import type {
  SurfaceElevation,
  SurfacePadding,
  SurfaceRadius,
  SurfaceTone,
  SurfaceVariant,
} from '../../../foundation/utils';
import type { EqualityFn, ListboxIndicator } from './ListboxContext';

/**
 * Represents the prop surface of the `Listbox` root.
 *
 * React modelled single- vs multi-select as a discriminated union
 * (`SingleProps<T> | MultiProps<T>`) over a generic `T`. Vue's `defineProps`
 * resolves one flat runtime shape, and a `generic="T"` SFC cannot host the
 * exported interface in the plain `<script>` block — so the union is flattened
 * and `T` is fixed to `unknown`. `isMultiple` still discriminates at runtime:
 * the value is an array in multi mode and a scalar in single mode.
 *
 * The five surface axes are spelled out rather than inherited from
 * `SurfaceVariants`: that alias is `VariantProps<typeof surfaceVariants>`, which
 * the SFC compiler cannot follow as a heritage clause — it throws `Failed to
 * resolve extends base type` at build time while `vue-tsc` stays green. Named
 * types resolve fine, and the props have to be generated (not treated as
 * fallthrough attrs) because `rootClass` reads them.
 */
export interface ListboxProps {
  /** The surface style. */
  variant?: SurfaceVariant;

  /** The surface tone. */
  tone?: SurfaceTone;

  /** The corner radius. */
  radius?: SurfaceRadius;

  /** The inner padding. Default `xs` (p-1), for items breathing room. */
  padding?: SurfacePadding;

  /** The elevation / shadow step. */
  elevation?: SurfaceElevation;

  /** The multi-select state — the value becomes an array and items toggle. */
  isMultiple?: boolean;

  /** The selection, controlled. The `v-model` binding target. Array in multi mode. */
  modelValue?: unknown;

  /** The selection, controlled — React's spelling of `modelValue`, which wins when both are set. */
  value?: unknown;

  /** The initial selection when uncontrolled. Defaults to `[]` in multi mode. */
  defaultValue?: unknown;

  /** Disables all items when true. */
  isDisabled?: boolean;

  /** Compares item values for equality; defaults to `Object.is`. */
  isEqual?: EqualityFn<unknown>;

  /** Sets the selection-indicator style; default `check` (single) or `checkbox` (multi). */
  indicator?: ListboxIndicator;

  /** The tab index of the list container. Defaults to `0`, or `-1` while disabled. */
  tabindex?: number;
}
</script>

<script setup lang="ts">
import { computed, onMounted, provide, ref, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { cn, surfaceVariants } from '../../../foundation/utils';
import { useControlled, useTypeahead } from '../../../foundation/hooks';
import { listboxVariants } from './Listbox.variants';
import {
  defaultEquals,
  listboxContextKey,
  ListboxIndicator as ListboxIndicatorValue,
  type ItemEntry,
  type ListboxContextValue,
} from './ListboxContext';

/**
 * Roving-`aria-activedescendant` listbox with type-to-select, single or multi
 * selection, and pluggable selection indicators. Items register themselves, so
 * arbitrary `children` work without threading a label prop.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'Listbox', inheritAttrs: false });

const props = withDefaults(defineProps<ListboxProps>(), {
  /* Explicit `undefined` defaults: Vue casts an absent `boolean` prop to `false`, which would
     make `isDisabled` read as an explicit "enabled" and, for `isMultiple`, is simply the real
     default — but `isDisabled` must stay tri-state for the `aria-disabled` / tabindex branches. */
  isMultiple: false,
  isDisabled: undefined,
});

const emit = defineEmits<{
  /** The `v-model` half. */
  'update:modelValue': [value: unknown];
  /** Replaces React's `onValueChange`. */
  'value-change': [value: unknown];
  /**
   * Replaces React's `onActiveChange`. Fires after commit whenever the active
   * (`aria-activedescendant`) option id changes — including the initial auto-active
   * on mount. Lets a hosting combobox mirror the id without scraping the DOM.
   */
  'active-change': [id: string | null];
}>();

const attrs = useAttrs();

/* `EqualityFn` is already imported by the plain `<script>` block above — both blocks share one
   module scope, so re-importing it here would be a duplicate declaration. */
const equals = computed<EqualityFn<unknown>>(() => props.isEqual ?? defaultEquals);

const resolvedIndicator = computed(
  () =>
    props.indicator ??
    (props.isMultiple ? ListboxIndicatorValue.Checkbox : ListboxIndicatorValue.Check),
);

const controlled = useControlled<unknown>({
  controlled: () => props.modelValue ?? props.value,
  default: () => props.defaultValue ?? (props.isMultiple ? [] : undefined),
  onChange: (next) => {
    emit('update:modelValue', next);
    emit('value-change', next);
  },
});

const values = computed<ReadonlyArray<unknown>>(() => {
  const current = controlled.value.value;
  if (Array.isArray(current)) return current as unknown[];
  return current === undefined ? [] : [current];
});

/* A plain array, not a ref: React held this in a `useRef` precisely so registration churn
   never drove a render, and the reads below all happen inside event handlers. `activeId` is
   the reactive half, and it is what descendants actually re-render on. */
const items: ItemEntry[] = [];
const activeId = ref<string | null>(null);

function registerItem(entry: ItemEntry): void {
  const idx = items.findIndex((i) => i.id === entry.id);
  if (idx >= 0) items[idx] = entry;
  else items.push(entry);
}

function unregisterItem(id: string): void {
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items.splice(idx, 1);
}

function setActiveId(id: string | null): void {
  activeId.value = id;
}

function onItemSelect(next: unknown): void {
  if (props.isMultiple) {
    const current = controlled.value.value;
    const list = (Array.isArray(current) ? current : []) as unknown[];
    const has = list.some((v) => equals.value(v, next));
    controlled.setValue(has ? list.filter((v) => !equals.value(v, next)) : [...list, next]);
  } else {
    controlled.setValue(next);
  }
}

/* The initial auto-active: first selected enabled option, else the first enabled one.
   `onMounted` is the Vue equivalent of React's mount-only effect — children have registered
   by then, and it never runs on the server. */
onMounted(() => {
  if (activeId.value) return;
  const firstSelected = items.find(
    (i) => !i.isDisabled && values.value.some((v) => equals.value(v, i.value)),
  );
  const firstEnabled = items.find((i) => !i.isDisabled);
  activeId.value = (firstSelected ?? firstEnabled)?.id ?? null;
});

/* Mirrors the active id to a hosting combobox after commit, including the initial auto-active. */
watch(activeId, (id) => emit('active-change', id), { flush: 'post' });

const root = useTemplateRef<HTMLDivElement>('root');

/** Activates an option by id and keeps it visible (lists are `max-h-72 overflow-y-auto`). */
function activateById(id: string): void {
  activeId.value = id;
  /* Event-driven only, so `document` is always defined here — but the guard keeps the
     function safe if it is ever reached from a render-time path under SSR. */
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
}

function moveActive(direction: 1 | -1, jump = 1): void {
  const list = items.filter((i) => !i.isDisabled);
  if (list.length === 0) return;
  const currentIdx = list.findIndex((i) => i.id === activeId.value);
  let nextIdx = currentIdx + direction * jump;
  if (currentIdx === -1) nextIdx = direction === 1 ? 0 : list.length - 1;
  if (nextIdx < 0) nextIdx = 0;
  if (nextIdx >= list.length) nextIdx = list.length - 1;
  const nextEntry = list[nextIdx];
  if (nextEntry) activateById(nextEntry.id);
}

/* Type-to-select over the registered options. Labels are read from the live DOM text of each
   option (`document.getElementById` inside the user-event path → SSR-safe), so arbitrary
   children work without threading a label prop. Disabled options are skipped by the matcher. */
const typeahead = useTypeahead<ItemEntry>({
  items: () => items,
  getLabel: (entry) =>
    typeof document === 'undefined' ? '' : (document.getElementById(entry.id)?.textContent ?? ''),
  isDisabled: (entry) => entry.isDisabled,
  getActiveIndex: () => items.findIndex((i) => i.id === activeId.value),
  onMatch: (entry) => activateById(entry.id),
});

function handleKeyDown(event: KeyboardEvent): void {
  /* React called the consumer's `onKeyDown` first and then honoured `defaultPrevented`.
     A fallthrough listener would be merged AFTER this handler and lose that ordering, so the
     consumer's handler is pulled off `attrs` and invoked by hand (and excluded from the
     passthrough below so it cannot fire twice). */
  (attrs.onKeydown as ((e: KeyboardEvent) => void) | undefined)?.(event);
  if (event.defaultPrevented || props.isDisabled) return;
  /* Type-to-select first: a printable char (incl. Space while a buffer is active) is consumed
     here and must not fall through to Enter/Space selection or anything else. */
  if (typeahead.onKeyDown(event)) {
    event.preventDefault();
    return;
  }
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      moveActive(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      moveActive(-1);
      break;
    case 'Home':
      event.preventDefault();
      moveActive(-1, items.length);
      break;
    case 'End':
      event.preventDefault();
      moveActive(1, items.length);
      break;
    case 'PageDown':
      event.preventDefault();
      moveActive(1, 10);
      break;
    case 'PageUp':
      event.preventDefault();
      moveActive(-1, 10);
      break;
    case 'Enter':
    case ' ': {
      if (!activeId.value) return;
      const entry = items.find((i) => i.id === activeId.value);
      if (!entry || entry.isDisabled) return;
      event.preventDefault();
      onItemSelect(entry.value);
      break;
    }
  }
}

const context: ListboxContextValue = {
  get isMultiple() {
    return props.isMultiple;
  },
  get values() {
    return values.value;
  },
  get isEqual() {
    return equals.value;
  },
  get activeId() {
    return activeId.value;
  },
  get indicator() {
    return resolvedIndicator.value;
  },
  get isDisabled() {
    return props.isDisabled ?? false;
  },
  onItemSelect,
  registerItem,
  unregisterItem,
  setActiveId,
};

provide(listboxContextKey, context);

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class', 'onKeydown']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const listTabIndex = computed(() => (props.isDisabled ? -1 : (props.tabindex ?? 0)));

const rootClass = computed(() =>
  cn(
    surfaceVariants({
      variant: props.variant,
      tone: props.tone,
      radius: props.radius,
      /* Default padding is `xs` (p-1) for items breathing room — overridable. */
      padding: props.padding ?? 'xs',
      elevation: props.elevation,
    }),
    listboxVariants(),
    attrs.class as ClassValue,
  ),
);

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div
    ref="root"
    role="listbox"
    :tabindex="listTabIndex"
    :aria-multiselectable="isMultiple || undefined"
    :aria-activedescendant="activeId ?? undefined"
    :aria-disabled="isDisabled || undefined"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @keydown="handleKeyDown"
  >
    <slot />
  </div>
</template>
