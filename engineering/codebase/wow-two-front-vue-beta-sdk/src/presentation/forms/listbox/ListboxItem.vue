<script lang="ts">
import type { ListboxIndicator } from './ListboxContext';

/** Represents the prop surface of `Listbox.Item`. */
export interface ListboxItemProps {
  /** The item value; compared via the parent listbox's `isEqual`. */
  value: unknown;

  /** The disabled state for this item. */
  isDisabled?: boolean;

  /** The per-item indicator, overriding the listbox-level indicator. */
  indicator?: ListboxIndicator;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, useTemplateRef, watch } from 'vue';
import type { ClassValue } from 'clsx';
import { Check } from 'lucide-vue-next';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { listboxItemVariants, ListboxItemState } from './Listbox.variants';
import { useListboxContext, ListboxIndicator as ListboxIndicatorValue } from './ListboxContext';

const CheckIcon = Check;

/**
 * A single selectable option. Registers itself with the surrounding `Listbox`
 * on mount so keyboard navigation, typeahead, and value lookup can see it.
 */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ListboxItem', inheritAttrs: false });

const props = withDefaults(defineProps<ListboxItemProps>(), {
  isDisabled: false,
});

const attrs = useAttrs();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useListboxContext();

const id = useId();

/* React registered in an effect keyed on `[id, value, isDisabled]`; the Vue counterpart is a
   watcher with `immediate` so the entry exists before the parent's mount-time auto-active runs. */
watch(
  () => ({ value: props.value, isDisabled: props.isDisabled }),
  ({ value, isDisabled }) => ctx.registerItem({ id, value, isDisabled }),
  { immediate: true },
);
onBeforeUnmount(() => ctx.unregisterItem(id));

const indicator = computed(() => props.indicator ?? ctx.indicator);
const isSelected = computed(() => ctx.values.some((v) => ctx.isEqual(v, props.value)));
const isActive = computed(() => ctx.activeId === id);

const state = computed<ListboxItemState>(() => {
  if (props.isDisabled) return ListboxItemState.Disabled;
  if (isSelected.value) return ListboxItemState.Selected;
  if (isActive.value) return ListboxItemState.Active;
  return ListboxItemState.Default;
});

function onClick(event: MouseEvent): void {
  /* `ctx.isDisabled` = listbox-level disabled — keyboard is blocked in the root's key handler;
     mirror it for mouse. */
  if (event.defaultPrevented || props.isDisabled || ctx.isDisabled) return;
  ctx.onItemSelect(props.value);
}

function onPointerEnter(): void {
  if (!props.isDisabled) ctx.setActiveId(id);
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(listboxItemVariants({ state: state.value }), attrs.class as ClassValue),
);

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div
    ref="root"
    :id="id"
    role="option"
    :aria-selected="isSelected"
    :aria-disabled="isDisabled || undefined"
    :data-active="isActive ? '' : undefined"
    :data-selected="isSelected ? '' : undefined"
    :data-disabled="isDisabled ? '' : undefined"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @click="onClick"
    @pointerenter="onPointerEnter"
  >
    <!-- Leading indicator: checkbox · radio · dot. -->
    <span
      v-if="indicator === ListboxIndicatorValue.Checkbox"
      aria-hidden="true"
      :class="
        cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
        )
      "
    >
      <CheckIcon v-if="isSelected" class="h-3 w-3" />
    </span>
    <span
      v-else-if="indicator === ListboxIndicatorValue.Radio"
      aria-hidden="true"
      :class="
        cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          isSelected ? 'border-primary' : 'border-border',
        )
      "
    >
      <span v-if="isSelected" class="h-2 w-2 rounded-full bg-primary" />
    </span>
    <span
      v-else-if="indicator === ListboxIndicatorValue.Dot"
      aria-hidden="true"
      :class="cn('h-1.5 w-1.5 shrink-0 rounded-full', isSelected ? 'bg-primary' : 'bg-transparent')"
    />

    <!--
      `data-listbox-item-content` is a stable hook for hosts that need to target the option's
      content wrapper (e.g. Select's `matchWidth` truncation) without a brittle structural selector.
    -->
    <span data-listbox-item-content class="flex min-w-0 flex-1 items-center gap-2">
      <slot />
    </span>

    <!-- Trailing indicator: check icon. -->
    <CheckIcon
      v-if="indicator === ListboxIndicatorValue.Check && isSelected"
      :class="cn('h-4 w-4 shrink-0', !ctx.isMultiple && 'opacity-80')"
    />
  </div>
</template>
