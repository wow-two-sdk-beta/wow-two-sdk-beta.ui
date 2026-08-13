<script lang="ts">
export interface MultiSelectTagsProps {
  /** The content shown when no values are selected. Fill the `placeholder` slot for richer content. */
  placeholder?: string | number;
}
</script>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { useMultiSelectContext } from './MultiSelectContext';

/** The chip strip rendered inside the trigger. */
defineOptions({ name: 'MultiSelectTags' });

defineProps<MultiSelectTagsProps>();

defineSlots<{ placeholder?(): unknown }>();

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useMultiSelectContext();

function tagLabel(value: string): string | number {
  return ctx.labels[value] ?? value;
}

/* Matches React exactly: a non-string label (a numeric one) falls back to the raw value
   rather than being interpolated into the accessible name. */
function removeLabel(value: string): string {
  const label = ctx.labels[value];
  return `Remove ${typeof label === 'string' ? label : value}`;
}

function remove(value: string, event: MouseEvent): void {
  event.stopPropagation();
  ctx.setValues(ctx.values.filter((x) => x !== value));
}

const CloseIcon = X;
</script>

<template>
  <!-- `muted-foreground` (not `subtle-foreground`): the trigger surface is muted, where
       subtle is only 4.2:1 (see index.css). -->
  <span v-if="ctx.values.length === 0" class="text-muted-foreground">
    <slot name="placeholder">{{ placeholder }}</slot>
  </span>
  <span v-else class="flex flex-1 flex-wrap items-center gap-1">
    <span
      v-for="v in ctx.values"
      :key="v"
      class="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs"
    >
      {{ tagLabel(v) }}
      <span
        v-if="!ctx.isDisabled"
        role="button"
        :tabindex="-1"
        :aria-label="removeLabel(v)"
        class="cursor-pointer rounded-sm p-0.5 hover:bg-border"
        @click="remove(v, $event)"
        @pointerdown.stop
      >
        <CloseIcon class="h-3 w-3" />
      </span>
    </span>
  </span>
</template>
