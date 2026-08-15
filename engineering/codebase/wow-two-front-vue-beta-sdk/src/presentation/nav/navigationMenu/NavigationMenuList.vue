<script lang="ts">
/**
 * The prop surface of `NavigationMenuList`.
 *
 * React declared `extends HTMLAttributes<HTMLDivElement>` plus `children`;
 * attributes reach the root through `useAttrs` here and `children` is the
 * default slot, which leaves no declared prop.
 */
export type NavigationMenuListProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { RovingFocusGroup } from '../../../foundation/primitives';

/** The horizontal strip of items. Arrow-key navigation comes from `RovingFocusGroup`. */
defineOptions({ name: 'NavigationMenuList', inheritAttrs: false });

/** The `NavigationMenuItem` children — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<InstanceType<typeof RovingFocusGroup>>('el');

const classes = computed(() => cn('flex items-center gap-1', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- `role` falls through and replaces the primitive's own `role="group"`. -->
  <RovingFocusGroup ref="el" orientation="horizontal" can-loop role="list" v-bind="rest" :class="classes">
    <slot />
  </RovingFocusGroup>
</template>
