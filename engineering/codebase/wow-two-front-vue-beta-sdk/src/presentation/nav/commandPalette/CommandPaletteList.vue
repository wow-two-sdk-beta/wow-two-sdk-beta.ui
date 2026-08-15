<script lang="ts">
/**
 * The prop surface of `CommandPaletteList`.
 *
 * React declared `HTMLAttributes<HTMLDivElement>`; attributes reach the root
 * through `useAttrs` here, which leaves no declared prop.
 */
export type CommandPaletteListProps = Record<string, never>;
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useCommandPaletteContext } from './CommandPaletteContext';

/** The scrollable `role="listbox"` the input drives. */
defineOptions({ name: 'CommandPaletteList', inheritAttrs: false });

/** The groups / items — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const context = useCommandPaletteContext();

const classes = computed(() => cn('max-h-80 overflow-y-auto p-1', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    :id="context.listboxId"
    ref="el"
    role="listbox"
    :aria-labelledby="context.inputId"
    v-bind="rest"
    :class="classes"
  >
    <slot />
  </div>
</template>
