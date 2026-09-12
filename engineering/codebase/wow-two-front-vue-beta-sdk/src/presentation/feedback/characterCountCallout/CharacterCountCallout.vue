<script lang="ts">
export interface CharacterCountCalloutProps {
  /** The current length. */
  readonly value: number;

  /** The maximum allowed length (also flips text to destructive when exceeded). */
  readonly max: number;

  /** The display mode — `current / max` (default) or just `current`. */
  readonly isMaxShown?: boolean;
}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import type { ClassValue } from 'clsx';
import { cn } from '../../../foundation/styles';

/** Renders the live character count for a limited field, going destructive once `value` passes `max`. */
/* `inheritAttrs: false` so `class` folds into the component's own `cn()` call — plain fallthrough
   appends outside it and loses tailwind-merge conflict resolution. */
defineOptions({ name: 'CharacterCountCallout', inheritAttrs: false });

const props = withDefaults(defineProps<CharacterCountCalloutProps>(), { isMaxShown: true });

const attrs = useAttrs();

const isOver = computed(() => props.value > props.max);

const OwnedAttributes: ReadonlySet<string> = new Set(['class']);
const passthroughAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => !OwnedAttributes.has(key))),
);

const rootClass = computed(() =>
  cn('text-right text-xs', isOver.value ? 'text-destructive' : 'text-muted-foreground', attrs.class as ClassValue),
);

const root = useTemplateRef<HTMLDivElement>('root');

/** The rendered element — the Vue stand-in for the React original's forwarded ref. */
defineExpose({ el: root });
</script>

<template>
  <div ref="root" aria-live="polite" :class="rootClass" v-bind="passthroughAttrs">
    {{ value }}{{ isMaxShown ? ` / ${max}` : '' }}
  </div>
</template>
