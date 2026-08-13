<script lang="ts">
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type -- kept as an
   exported name: React declared `CarouselSlidesProps` and consumers import it. Its
   only member was `children`, which is the default slot here. */
export interface CarouselSlidesProps {}
</script>

<script setup lang="ts">
import { computed, onMounted, onUpdated, useAttrs, useSlots, useTemplateRef, type VNode } from 'vue';
import { cn } from '../../../foundation/utils';
import { renderableChildren } from '../../../foundation/primitives';
import { useCarouselContext } from './CarouselContext';

/**
 * The sliding track. Each child is wrapped in its own `role="group"` slide frame,
 * exactly as React's `Children.toArray(children).filter(isValidElement)` did.
 */
defineOptions({ name: 'CarouselSlides', inheritAttrs: false });

/** The slides — React's required `children`. */
defineSlots<{ default(): unknown }>();

const attrs = useAttrs();
const slots = useSlots();
const el = useTemplateRef<HTMLDivElement>('el');
const carousel = useCarouselContext();

/**
 * A function, not a `computed`: the slot is re-invoked on every render, so the
 * vnodes handed to `v-for` are always fresh rather than a cached array of
 * already-mounted ones. Call it — `v-for` over a bare function iterates nothing.
 */
function slideChildren(): Array<VNode> {
  return renderableChildren(slots.default?.());
}

/**
 * React published the count from `useEffect([childArray.length])`. Vue has no
 * children array to depend on, so the count is re-read after every render of
 * this component — which is precisely when the slot content can have changed.
 * Writing an unchanged count is a no-op on a ref, so this cannot loop.
 */
function syncCount(): void {
  carousel.setCount(slideChildren().length);
}

onMounted(syncCount);
onUpdated(syncCount);

const classes = computed(() =>
  cn('flex transition-transform duration-300 ease-out', attrs.class as string | undefined),
);

/** Vue does not append units to a numeric `:style` value the way React does — spelled out. */
const trackStyle = computed(() => ({ transform: `translateX(-${carousel.index * 100}%)` }));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <div
    ref="el"
    :aria-live="carousel.autoPlay ? 'off' : 'polite'"
    v-bind="rest"
    :class="classes"
    :style="trackStyle"
  >
    <!-- The single-element `v-for` hoists the slot call into a template local, so
         the slot is invoked once per render and `length` is React's
         `childArray.length` rather than the injected count, which lags by a tick. -->
    <template v-for="(children, hoist) in [slideChildren()]" :key="hoist">
      <div
        v-for="(child, slideIndex) in children"
        :key="slideIndex"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${slideIndex + 1} of ${children.length}`"
        :aria-hidden="slideIndex !== carousel.index || undefined"
        class="w-full shrink-0"
      >
        <component :is="child" />
      </div>
    </template>
  </div>
</template>
