<script lang="ts">
// `ColorMode` is imported as a value by `<script setup>` below; both blocks
// share one module scope, so re-importing the type here would duplicate it.
export interface ColorModeProviderProps {
  /** The mode used when nothing is persisted. `'system'` follows the OS preference. Default `'system'`. */
  readonly defaultMode?: ColorMode | 'system';

  /** The `localStorage` key for persistence; pass `null` to disable. Default `'wow-color-mode'`. */
  readonly storageKey?: string | null;
}
</script>

<script setup lang="ts">
import { onMounted, provide, shallowRef, watch, watchEffect } from 'vue';
import { useMediaQuery } from '../../device';
import { ColorMode, ColorModeKey, type ColorModeContextValue } from './ColorModeContext';

/**
 * Renders no element of its own — the slot passes straight through — while owning the app's light/dark mode:
 * toggles the `dark` class on `<html>` (which flips every semantic token) + sets `color-scheme`, persists the
 * choice, and falls back to the OS preference. Wrap the app once; read via `useColorMode()`. This is the
 * canonical `.dark` mechanism for the design tokens.
 */
defineOptions({ name: 'ColorModeProvider' });

const props = withDefaults(defineProps<ColorModeProviderProps>(), {
  defaultMode: 'system',
  storageKey: 'wow-color-mode',
});

defineSlots<{
  /** The subtree that reads the active color mode. */
  default(): unknown;
}>();

/** Explicit defaults are shared by SSR and the first client render. */
const mode = shallowRef<ColorMode>(props.defaultMode === 'system' ? ColorMode.Light : props.defaultMode);
const mounted = shallowRef(false);
const followsSystem = shallowRef(false);
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

onMounted(() => {
  let stored: string | null = null;
  try {
    stored = props.storageKey ? window.localStorage.getItem(props.storageKey) : null;
  } catch {
    // Storage denial must not disable the in-memory theme control.
  }
  followsSystem.value = stored !== ColorMode.Light && stored !== ColorMode.Dark && props.defaultMode === 'system';
  mode.value =
    stored === ColorMode.Light || stored === ColorMode.Dark
      ? stored
      : followsSystem.value
        ? prefersDark.value
          ? ColorMode.Dark
          : ColorMode.Light
        : mode.value;
  mounted.value = true;
});

watch(prefersDark, (dark) => {
  if (followsSystem.value) mode.value = dark ? ColorMode.Dark : ColorMode.Light;
});

watchEffect(() => {
  if (!mounted.value || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', mode.value === ColorMode.Dark);
  root.style.colorScheme = mode.value;
});

function setMode(next: ColorMode): void {
  followsSystem.value = false;
  mode.value = next;
  if (!props.storageKey || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(props.storageKey, next);
  } catch {
    // Storage may be disabled or full; the chosen mode remains active.
  }
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
