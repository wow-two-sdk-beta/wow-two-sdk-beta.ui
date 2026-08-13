<script lang="ts">
export interface TabsPanelProps {
  /** The value this panel belongs to — pairs it with the `TabsTab` of the same value. */
  value: string;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useTabsContext } from './TabsContext';

/**
 * The panel for one tab. Only the active panel is mounted (APG) — there is no
 * `Presence`/exit, the outgoing panel just unmounts, and the incoming one is a
 * fresh mount so the fade-in replays. React forced that with `key={ctx.value}`.
 */
defineOptions({ name: 'TabsPanel', inheritAttrs: false });

/** The panel content — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<TabsPanelProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const tabs = useTabsContext();

const isActive = computed(() => tabs.value === props.value);

const tabId = computed(() => `${tabs.baseId}-tab-${props.value}`);
const panelId = computed(() => `${tabs.baseId}-panel-${props.value}`);

const classes = computed(() =>
  cn(
    'flex-1 outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'motion-safe:animate-(--animate-fade-in)',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    v-if="isActive"
    ref="el"
    v-bind="rest"
    :id="panelId"
    role="tabpanel"
    :aria-labelledby="tabId"
    :tabindex="0"
    :class="classes"
  >
    <slot />
  </div>
</template>
