<script lang="ts">
import type { AnchorHTMLAttributes } from 'vue';

/* Native anchor attributes stay in attribute fallthrough rather than becoming runtime props. */
export type ToolbarLinkProps = /* @vue-ignore */ Omit<AnchorHTMLAttributes, 'children'>;
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/utils';
import { useRovingFocusItem } from '../../../foundation/primitives';

/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'ToolbarLink', inheritAttrs: false });

const attrs = useAttrs();

/* Reactive object — `tabindex` tracks the group's tab stop, so read through it rather than
   destructuring. The function `ref` registers this item's node with the group. */
const roving = useRovingFocusItem();

const OWNED_ATTRS: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OWNED_ATTRS.has(key))),
);

const rootClass = computed(() =>
  cn(
    'inline-flex h-8 items-center justify-center rounded-sm px-2 text-sm text-foreground underline-offset-2 transition-colors hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    attrs.class as ClassValue,
  ),
);

/* Chained after the consumer's own keydown (attribute fallthrough puts theirs first) and skipped
   when they called `preventDefault()` — the original's explicit `if (e.defaultPrevented) return`. */
function handleKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  roving.onKeydown(event);
}
</script>

<template>
  <a
    :ref="roving.ref"
    :tabindex="roving.tabindex"
    :data-roving-focus-item="roving['data-roving-focus-item']"
    :class="rootClass"
    v-bind="passthroughAttrs"
    @focus="roving.onFocus()"
    @keydown="handleKeydown"
  >
    <slot />
  </a>
</template>
