<script lang="ts">
import type { ImgHTMLAttributes } from 'vue';

/** React's `fallback` ReactNode became a named slot, leaving the `<img>` attributes. */
export type ImageProps = ImgHTMLAttributes;
</script>

<script setup lang="ts">
import { computed, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/utils';

/**
 * Image with built-in error fallback. The fallback slot replaces the
 * `<img>` on error (broken `src`, network failure). For aspect-locked
 * images, wrap in `AspectRatio`.
 */
defineOptions({ name: 'Image', inheritAttrs: false });

defineSlots<{
  /** The element rendered when the image fails to load. */
  fallback?(): unknown;
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLImageElement>('el');

const errored = ref(false);

/* A new src deserves a fresh load attempt — reset the error latch. `src` is a
   fallthrough attr here, not a declared prop, so the watch reads it off `attrs`. */
watch(
  () => attrs.src,
  () => {
    errored.value = false;
  },
);

/** React defaulted `alt` to `''`; in Vue it arrives as a fallthrough attr. */
const alt = computed(() => (attrs.alt as string | undefined) ?? '');

const classes = computed(() => cn('block max-w-full', attrs.class as string | undefined));

/** Everything but `class` / `alt`, both re-applied explicitly below. */
const rest = computed(() => {
  const { class: _class, alt: _alt, ...others } = attrs;
  return others;
});

/**
 * A consumer-supplied `onError` rides in `rest`; Vue's `mergeProps` chains it
 * with this one rather than replacing it, matching React's `onError?.(e)` call.
 */
const onError = (): void => {
  errored.value = true;
};

defineExpose({ el });
</script>

<template>
  <slot v-if="errored && $slots.fallback" name="fallback" />
  <img v-else ref="el" v-bind="rest" :alt="alt" :class="classes" @error="onError" />
</template>
