<script lang="ts">
// `ColorMode` is imported as a value by `<script setup>` below; both blocks
// share one module scope, so re-importing the type here would duplicate it.
export interface ColorModeProviderProps {
  /** The mode used when nothing is persisted. `'system'` follows the OS preference. Default `'system'`. */
  defaultMode?: ColorMode | 'system';

  /** The `localStorage` key for persistence; pass `null` to disable. Default `'wow-color-mode'`. */
  storageKey?: string | null;
}
</script>

<script setup lang="ts">
import { provide, shallowRef, watchEffect } from 'vue';
import { ColorMode, ColorModeKey, systemMode, type ColorModeContextValue } from './ColorModeContext';

/**
 * Owns the app's light/dark mode: toggles the `dark` class on `<html>` (which flips every semantic
 * token) + sets `color-scheme`, persists the choice, and falls back to the OS preference. Wrap the
 * app once; read via `useColorMode()`. This is the canonical `.dark` mechanism for the design tokens.
 */
defineOptions({ name: 'ColorModeProvider' });

const props = withDefaults(defineProps<ColorModeProviderProps>(), {
  defaultMode: 'system',
  storageKey: 'wow-color-mode',
});

/** Resolved once at setup, the same way React resolved it in the `useState` initializer. */
const mode = shallowRef<ColorMode>(
  (() => {
    if (typeof window === 'undefined') return ColorMode.Light;
    const stored = props.storageKey
      ? (localStorage.getItem(props.storageKey) as ColorMode | null)
      : null;
    if (stored === ColorMode.Light || stored === ColorMode.Dark) return stored;
    return props.defaultMode === 'system' ? systemMode() : props.defaultMode;
  })(),
);

watchEffect(() => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', mode.value === ColorMode.Dark);
  root.style.colorScheme = mode.value;
});

function setMode(next: ColorMode): void {
  mode.value = next;
  if (props.storageKey) localStorage.setItem(props.storageKey, next);
}

// A getter, so consumers read `ctx.mode` as a plain value exactly like the
// React context object — and tracking still happens on access.
const context: ColorModeContextValue = {
  get mode() {
    return mode.value;
  },
  setMode,
  toggle: () => setMode(mode.value === ColorMode.Dark ? ColorMode.Light : ColorMode.Dark),
};

provide(ColorModeKey, context);
</script>

<template>
  <slot />
</template>
