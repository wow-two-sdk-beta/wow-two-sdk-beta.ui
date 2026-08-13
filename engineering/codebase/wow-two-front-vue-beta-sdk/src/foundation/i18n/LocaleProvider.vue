<script lang="ts">
import type { Messages } from './LocaleContext';

/** Props for `LocaleProvider`. */
export interface LocaleProviderProps {
  /** BCP-47 locale. Defaults to `navigator.language`, then `en-US`. */
  locale?: string;
  /** Consumer message overrides — a dictionary or a `(key, vars) => string` callback. */
  messages?: Messages;
}
</script>

<script setup lang="ts">
import { provideLocale } from './LocaleContext';

/**
 * Provides the active locale + message overrides to every descendant SDK component.
 *
 * Renders no element of its own — the slot passes straight through.
 */
defineOptions({ name: 'LocaleProvider' });

const props = defineProps<LocaleProviderProps>();

provideLocale(
  () => props.locale,
  () => props.messages,
);
</script>

<template>
  <slot />
</template>
