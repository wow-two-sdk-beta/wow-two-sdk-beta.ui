<script lang="ts">
import type { ListMarker, ListSpacing } from './List.variants';

export interface ListProps {
  /** The ordered mode — renders `<ol>` instead of `<ul>`. */
  isOrdered?: boolean;

  /** The item marker style. */
  marker?: ListMarker;

  /** The vertical spacing between items. */
  spacing?: ListSpacing;
}
</script>

<script setup lang="ts">
import { computed, provide, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { listVariants } from './List.variants';
import { ListKey } from './ListContext';

/**
 * Bulleted / numbered / check list container. Pair with `ListItem` for the
 * leading-trailing row shape; a bare `<li>` works too.
 */
defineOptions({ name: 'List', inheritAttrs: false });

/** The list items — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<ListProps>(), { isOrdered: undefined });

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');

const tag = computed(() => (props.isOrdered ? 'ol' : 'ul'));

/* `marker="check"` sets `list-none` — the check itself is drawn by `ListItem`, which
   needs the root's marker to know that. A getter keeps the value live. */
provide(ListKey, {
  get marker() {
    return props.marker ?? 'none';
  },
});

const classes = computed(() =>
  cn(listVariants({ marker: props.marker, spacing: props.spacing }), attrs.class as string | undefined),
);

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <component :is="tag" ref="el" v-bind="rest" :class="classes"><slot /></component>
</template>
