<script lang="ts">
/** Internal — the animated wrapper `Presence` mounts for an expanded branch. */
export interface TreeGroupContentProps {
  /** The nesting depth published to the rows inside. */
  level: number;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { TreeLevelKey, type TreeLevelValue } from './TreeContext';

/*
 * Inner element rendered by `<Presence>`: it clones this component's vnode with
 * `data-state` + a ref, both of which reach the root `<div>` through `rest`.
 * Expand/collapse animates content HEIGHT via grid-template-rows 0fr -> 1fr; the
 * inner `min-h-0 overflow-hidden` track clips the group so it can shrink to zero.
 * No fade (height only) — the chevron handles the rotate. Motion-safe-gated;
 * reduced-motion gets an instant snap.
 */
defineOptions({ name: 'TreeGroupContent', inheritAttrs: false });

/** The nested `TreeGroup` / `TreeItem` children. */
defineSlots<{ default(): unknown }>();

const props = defineProps<TreeGroupContentProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

/* Live getter, not a snapshot — React re-provided on every render. */
provide<TreeLevelValue>(TreeLevelKey, {
  get level() {
    return props.level;
  },
});

const classes = computed(() =>
  cn(
    'grid',
    'motion-safe:transition-[grid-template-rows] motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) motion-reduce:transition-none',
    'data-[state=open]:grid-rows-[1fr] data-[state=closed]:grid-rows-[0fr]',
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
  <div ref="el" v-bind="rest" :class="classes">
    <div class="min-h-0 overflow-hidden">
      <ul role="group" class="flex flex-col">
        <slot />
      </ul>
    </div>
  </div>
</template>
