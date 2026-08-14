<script lang="ts">
export interface CollapsibleContentProps {
  /** The force-mounted mode — renders hidden content but keeps it in the DOM (for animations). */
  isForceMounted?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useTemplateRef, type ComponentPublicInstance } from 'vue';
import { Presence } from '../../../foundation/primitives';
import { useCollapsibleContext } from './CollapsibleContext';
import CollapsibleContentInner from './CollapsibleContentInner.vue';

/**
 * The disclosure pane. Force-mounted it renders straight through with an explicit
 * `data-state`; otherwise `Presence` keeps it mounted until the close animation ends and
 * supplies `data-state` itself.
 */
defineOptions({ name: 'CollapsibleContent', inheritAttrs: false });

/** The pane content — React's required `children`. */
defineSlots<{ default(): unknown }>();

/* Not bound to a `props` const: with every reference now in the template — where the bare
   name compiles to `$props`, which survives a setup throw — the binding would be unused. */
withDefaults(defineProps<CollapsibleContentProps>(), {
  isForceMounted: undefined,
});

const context = useCollapsibleContext();
const inner = useTemplateRef<ComponentPublicInstance>('inner');

/** The rendered pane — the Vue stand-in for the React original's forwarded ref. */
const el = computed<HTMLElement | null>(() =>
  inner.value?.$el instanceof HTMLElement ? inner.value.$el : null,
);

defineExpose({ el });
</script>

<template>
  <CollapsibleContentInner
    v-if="isForceMounted"
    ref="inner"
    :is-force-mounted="isForceMounted"
    :data-state="context.open ? 'open' : 'closed'"
    v-bind="$attrs"
  >
    <slot />
  </CollapsibleContentInner>
  <Presence v-else :is-present="context.open">
    <CollapsibleContentInner
      ref="inner"
      :is-force-mounted="isForceMounted"
      v-bind="$attrs"
    >
      <slot />
    </CollapsibleContentInner>
  </Presence>
</template>
