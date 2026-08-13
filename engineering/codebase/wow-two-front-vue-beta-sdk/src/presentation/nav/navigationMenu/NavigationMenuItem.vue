<script lang="ts">
export interface NavigationMenuItemProps {
  /** The stable id for active-state tracking. Required when item has a Trigger + Content. */
  value: string;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import {
  navigationMenuItemContextKey,
  useNavigationMenuContext,
} from './NavigationMenuContext';

/** One `<li>` of the strip — pairs a Trigger / Link with its Content panel. */
defineOptions({ name: 'NavigationMenuItem', inheritAttrs: false });

/** The trigger / link and optional content — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<NavigationMenuItemProps>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLLIElement>('el');
const nav = useNavigationMenuContext();

provide(navigationMenuItemContextKey, {
  value: props.value,
  open: computed(() => nav.activeId.value === props.value),
  triggerEl: shallowRef<HTMLElement | null>(null),
  contentId: useId(),
  triggerId: useId(),
});

const classes = computed(() => cn('relative', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <li ref="el" v-bind="rest" :class="classes"><slot /></li>
</template>
