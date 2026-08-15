<script lang="ts">
export interface TabsTabProps {
  /** The value this tab selects — pairs it with the `TabsPanel` of the same value. */
  value: string;
  /** The disabled state. Default `false`. */
  isDisabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, mergeProps, shallowRef, useAttrs } from 'vue';
import { cn, dataAttr, Orientation } from '../../../foundation/utils';
import { useRovingFocusItem } from '../../../foundation/primitives';
import { TabsActivationMode, useTabsContext } from './TabsContext';

/** A single tab button. Selected tab is the roving tab stop, per APG. */
defineOptions({ name: 'TabsTab', inheritAttrs: false });

/** The tab label — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<TabsTabProps>(), { isDisabled: false });

const attrs = useAttrs();
const tabs = useTabsContext();

const selected = computed(() => tabs.value === props.value);

// Selected tab is the Tab stop (per APG) — seeds/syncs roving focusedId when focus is outside the tablist.
// Reactive object: bound with `v-bind`, never destructured.
const item = useRovingFocusItem({ isActive: () => selected.value });

/* One element, two consumers of `ref` — the roving group needs the node and
   `defineExpose` publishes it. React composed them with a callback ref; this is
   the same composition, and it wins over `item.ref` by sitting after `v-bind`. */
const el = shallowRef<HTMLButtonElement | null>(null);
function setRef(node: unknown): void {
  el.value = (node ?? null) as HTMLButtonElement | null;
  item.ref(node);
}

const tabId = computed(() => `${tabs.baseId}-tab-${props.value}`);
const panelId = computed(() => `${tabs.baseId}-panel-${props.value}`);

function onClick(event: MouseEvent): void {
  if (event.defaultPrevented || props.isDisabled) return;
  tabs.setValue(props.value);
}

function onFocus(): void {
  if (tabs.activationMode === TabsActivationMode.Automatic && !props.isDisabled) {
    tabs.setValue(props.value);
  }
}

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors',
    'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'data-[state=active]:text-foreground data-[state=active]:border-primary',
    tabs.orientation === Orientation.Vertical
      ? 'border-r-2 border-transparent data-[state=active]:border-primary'
      : 'border-b-2 border-transparent data-[state=active]:border-primary',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

/**
 * The fallthrough attrs merged with the roving-focus item's bindings.
 *
 * `mergeProps` rather than an object spread: both sides can carry `onFocus`, and
 * a spread would drop the consumer's. Reading `item`'s members inside a computed
 * keeps them tracked, so `tabindex` still follows the group's tab stop.
 * `item.ref` is overridden by the explicit `:ref` below, which composes it.
 */
const bindings = computed(() => mergeProps(rest.value, item as unknown as Record<string, unknown>));

defineExpose({ el });
</script>

<template>
  <!-- Own attrs, then `bindings` (fallthrough attrs + the roving item), then own
       handlers last — a consumer's `click` / `focus` handler therefore runs before
       ours, the order React got from calling `onClick?.(e)` ahead of its own logic,
       which is what makes the `defaultPrevented` check below meaningful. -->
  <button
    :id="tabId"
    role="tab"
    type="button"
    :aria-selected="selected"
    :aria-controls="panelId"
    :data-state="selected ? 'active' : 'inactive'"
    :data-disabled="dataAttr(isDisabled)"
    :disabled="isDisabled"
    v-bind="bindings"
    :ref="setRef"
    :class="classes"
    @click="onClick"
    @focus="onFocus"
  >
    <slot />
  </button>
</template>
