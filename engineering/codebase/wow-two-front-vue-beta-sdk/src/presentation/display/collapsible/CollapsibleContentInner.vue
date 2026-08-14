<script lang="ts">
/**
 * Internal — not exported from `index.ts`. The element `<Presence>` mounts and clones
 * `data-state` + its tracking ref onto, split out for exactly the reason React split it:
 * `Presence` needs a single element it can hand `data-state` to.
 */
export interface CollapsibleContentInnerProps {
  /** The force-mounted mode — keeps the pane in the DOM while closed. */
  isForceMounted?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useCollapsibleContext } from './CollapsibleContext';

/* Animates content height through grid-template-rows 0fr -> 1fr (gated on data-state) and layers
   a fade on the inner pane. Reduced-motion users get the resolved height/opacity with no
   transition (motion-safe / motion-reduce). */
defineOptions({ name: 'CollapsibleContentInner', inheritAttrs: false });

/** The pane content. */
defineSlots<{ default(): unknown }>();

/* Not bound to a `props` const: with every reference now in the template — where the bare
   name compiles to `$props`, which survives a setup throw — the binding would be unused. */
withDefaults(defineProps<CollapsibleContentInnerProps>(), {
  isForceMounted: undefined,
});

const attrs = useAttrs();
const context = useCollapsibleContext();
const el = useTemplateRef<HTMLDivElement>('el');

const classes = computed(() =>
  cn(
    'grid grid-rows-[0fr] motion-safe:transition-[grid-template-rows]',
    'motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out)',
    'data-[state=open]:grid-rows-[1fr]',
    attrs.class as string | undefined,
  ),
);

/**
 * Everything but `class`, which is re-applied through `cn` above. `data-state` rides in here —
 * `Presence` clones it onto this vnode, exactly as React's `{...props}` carried it.
 */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    :id="context.contentId"
    role="region"
    :aria-labelledby="context.triggerId"
    :hidden="!context.open && !isForceMounted"
    v-bind="rest"
    :class="classes"
  >
    <div
      class="min-h-0 overflow-hidden motion-safe:data-[state=open]:animate-(--animate-fade-in) motion-safe:data-[state=closed]:animate-(--animate-fade-out) motion-reduce:animate-none"
      :data-state="context.open ? 'open' : 'closed'"
    >
      <slot />
    </div>
  </div>
</template>
