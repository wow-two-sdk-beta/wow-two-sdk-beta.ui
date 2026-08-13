<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `CarouselViewportProps` and consumers import it.
   Its only member was `aria-label`, which stays a FALLTHROUGH attr — declaring a
   hyphenated prop name would have Vue camelize it to `ariaLabel`, so the
   `'Carousel'` default below would never apply. */
export interface CarouselViewportProps {}
</script>

<script setup lang="ts">
import { computed, useAttrs, useTemplateRef } from 'vue';
import { cn } from '../../../foundation/utils';
import { useCarouselContext } from './CarouselContext';

/** The clipping frame. Owns the arrow-key seam; React shipped it as `Carousel.Viewport`. */
defineOptions({ name: 'CarouselViewport', inheritAttrs: false });

/** The `CarouselSlides` content — React's `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');
const carousel = useCarouselContext();

/** The accessible label for the viewport. Default `'Carousel'`. */
const ariaLabel = computed(() => (attrs['aria-label'] as string | undefined) ?? 'Carousel');

/**
 * Runs after a consumer's own `keydown` — `rest` sits ahead of this binding in
 * the template, which is what makes the `defaultPrevented` check meaningful, the
 * same way React's explicit `onKeyDown?.(e)` call did.
 */
function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    carousel.prev();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    carousel.next();
  }
}

const classes = computed(() =>
  cn(
    'relative overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    attrs.class as string | undefined,
  ),
);

/** Everything but `class` and `aria-label`, both re-applied explicitly above. */
const rest = computed(() => {
  const { class: _class, 'aria-label': _ariaLabel, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    role="group"
    aria-roledescription="carousel"
    :aria-label="ariaLabel"
    :tabindex="0"
    v-bind="rest"
    :class="classes"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>
