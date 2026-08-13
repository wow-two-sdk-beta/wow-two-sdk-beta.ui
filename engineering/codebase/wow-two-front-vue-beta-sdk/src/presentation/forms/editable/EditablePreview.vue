<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `EditablePreviewProps` (an alias of
   `HTMLAttributes<HTMLSpanElement>`) and consumers import it. Every attribute falls through. */
export interface EditablePreviewProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useEditableContext } from './EditableContext';

/** The read-mode surface. Clicking (or Enter/Space) enters edit mode. */
defineOptions({ name: 'EditablePreview', inheritAttrs: false });

const attrs = useAttrs();
const el = useTemplateRef<HTMLSpanElement>('el');

/* `ctx` is a live-getter object — read fields off it, never destructure. */
const ctx = useEditableContext();

const interactive = computed(() => !ctx.isDisabled && !ctx.isReadOnly);
const isEmpty = computed(() => !ctx.value);

/* Runs after any caller-supplied `@click` (declared after `v-bind`), exactly as React's
   `onClick?.(e)` ran before this body. */
function onClick(event: MouseEvent): void {
  if (event.defaultPrevented || !interactive.value) return;
  ctx.setEditing(true);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || !interactive.value) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    ctx.setEditing(true);
  }
}

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const previewClass = computed(() =>
  cn(
    'cursor-text rounded-sm px-1 py-0.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isEmpty.value && 'italic text-subtle-foreground',
    !interactive.value && 'cursor-default hover:bg-transparent',
    attrs.class as ClassValue,
  ),
);

/** The rendered `<span>` — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el });
</script>

<template>
  <span
    v-if="!ctx.isEditing"
    ref="el"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : -1"
    :aria-disabled="!interactive || undefined"
    :class="previewClass"
    v-bind="passthroughAttrs"
    @click="onClick"
    @keydown="onKeydown"
  >
    {{ ctx.value || ctx.placeholder }}
  </span>
</template>
