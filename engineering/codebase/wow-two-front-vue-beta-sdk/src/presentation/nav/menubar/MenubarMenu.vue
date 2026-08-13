<script lang="ts">
export interface MenubarMenuProps {
  /** The stable id for this menu — used for active-menu tracking. */
  value: string;
}
</script>

<script setup lang="ts">
import { computed, provide, shallowRef } from 'vue';
import { menubarMenuContextKey, useMenubarContext } from './MenubarContext';

/**
 * One menu of the bar — pairs a `MenubarTrigger` with its `MenubarContent`.
 * Renders only its slot; React returned a bare context Provider.
 */
defineOptions({ name: 'MenubarMenu', inheritAttrs: false });

/** The `MenubarTrigger` and `MenubarContent` pair — React's `children`. */
defineSlots<{ default(): unknown }>();

const props = defineProps<MenubarMenuProps>();

const bar = useMenubarContext();

provide(menubarMenuContextKey, {
  id: props.value,
  open: computed(() => bar.activeId.value === props.value),
  setOpen: (next: boolean) => bar.setActiveId(next ? props.value : null),
  triggerEl: shallowRef<HTMLButtonElement | null>(null),
});
</script>

<template>
  <slot />
</template>
