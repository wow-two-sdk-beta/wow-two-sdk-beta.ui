<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `TabsListProps` and consumers import it. Its only
   member was `children`, which is the default slot here; every attribute falls through. */
export interface TabsListProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn, Orientation } from '../../../foundation/utils';
import { RovingFocusGroup } from '../../../foundation/primitives';
import { useTabsContext } from './TabsContext';

/** The tablist strip. Arrow-key navigation comes from `RovingFocusGroup`. */
defineOptions({ name: 'TabsList', inheritAttrs: false });

/** The `TabsTab` children — React's required `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<InstanceType<typeof RovingFocusGroup>>('el');
const tabs = useTabsContext();

const classes = computed(() =>
  cn(
    'inline-flex border-border',
    tabs.orientation === Orientation.Vertical ? 'flex-col border-r' : 'flex-row border-b',
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
  <RovingFocusGroup
    ref="el"
    :orientation="tabs.orientation"
    can-loop
    role="tablist"
    :aria-orientation="tabs.orientation"
    :data-orientation="tabs.orientation"
    v-bind="rest"
    :class="classes"
  >
    <slot />
  </RovingFocusGroup>
</template>
