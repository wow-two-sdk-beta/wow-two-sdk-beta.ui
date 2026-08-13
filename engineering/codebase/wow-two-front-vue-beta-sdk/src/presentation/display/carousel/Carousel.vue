<script lang="ts">
export interface CarouselProps {
  /** The controlled active slide index. */
  index?: number;
  /** The uncontrolled initial slide index. Default `0`. */
  defaultIndex?: number;
  /** The wrap-around state. Default `false`. */
  canLoop?: boolean;
  /** The auto-advance interval in ms. Omit to disable. */
  autoPlay?: number;
  /** The explicit slide count — overrides the automatic count (use for virtualised slides). */
  slidesCount?: number;
}
</script>

<script setup lang="ts">
import { computed, provide, ref, useAttrs, useTemplateRef, watch, watchEffect } from 'vue';
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { CarouselKey, type CarouselContextValue } from './CarouselContext';

/**
 * Carousel root. Owns the index, the slide count and the auto-play pause flag,
 * and publishes them to `CarouselViewport` / `CarouselSlides` / `CarouselPrev` /
 * `CarouselNext` / `CarouselDots` / `CarouselDot` through injection — React
 * attached those as statics, which an SFC's default export cannot carry.
 */
defineOptions({ name: 'Carousel', inheritAttrs: false });

/** The viewport, nav buttons and dots — React's required `children`. */
defineSlots<{ default(): unknown }>();

const props = withDefaults(defineProps<CarouselProps>(), {
  index: undefined,
  defaultIndex: 0,
  canLoop: false,
  autoPlay: undefined,
  slidesCount: undefined,
});

const emit = defineEmits<{
  /** Fires with the newly active slide index. */
  'index-change': [index: number];
}>();

const attrs = useAttrs();
const el = useTemplateRef<HTMLDivElement>('el');

const { value: index, setValue: setIndexState } = useControlled<number>({
  controlled: () => props.index,
  default: props.defaultIndex,
  onChange: (next) => emit('index-change', next),
});

const count = ref(props.slidesCount ?? 0);
const paused = ref(false);

// External override.
watch(
  () => props.slidesCount,
  (value) => {
    if (value != null) count.value = value;
  },
);

function setCount(next: number): void {
  count.value = next;
}

function setIndex(target: number): void {
  if (count.value === 0) {
    setIndexState(0);
    return;
  }
  const next = props.canLoop
    ? ((target % count.value) + count.value) % count.value
    : Math.max(0, Math.min(count.value - 1, target));
  setIndexState(next);
}

function prev(): void {
  setIndex(index.value - 1);
}

function next(): void {
  setIndex(index.value + 1);
}

function setPaused(value: boolean): void {
  paused.value = value;
}

// Auto-play. `watchEffect` rather than `watch` so the tracked set matches React's
// dependency array exactly — every value below is read up front, which is what
// makes the interval restart on an index change the way React's effect did.
watchEffect((onCleanup) => {
  const interval = props.autoPlay;
  const loop = props.canLoop;
  const total = count.value;
  const current = index.value;
  if (!interval || paused.value || total === 0) return;
  const handle = window.setInterval(() => {
    setIndex(loop ? current + 1 : Math.min(total - 1, current + 1));
  }, interval);
  onCleanup(() => window.clearInterval(handle));
});

/* Live getters, not a snapshot — index, count and pause state have to reach
   every already-mounted child. */
provide<CarouselContextValue>(CarouselKey, {
  get index() {
    return index.value;
  },
  setIndex,
  get count() {
    return count.value;
  },
  setCount,
  get loop() {
    return props.canLoop;
  },
  prev,
  next,
  get paused() {
    return paused.value;
  },
  setPaused,
  get autoPlay() {
    return props.autoPlay;
  },
});

const classes = computed(() => cn('relative', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- `focusin` / `focusout`, not `focus` / `blur`: React's `onFocus` / `onBlur`
       on a container bubble from descendants, and the native pair does not. -->
  <div
    ref="el"
    v-bind="rest"
    :class="classes"
    @mouseenter="setPaused(true)"
    @mouseleave="setPaused(false)"
    @focusin="setPaused(true)"
    @focusout="setPaused(false)"
  >
    <slot />
  </div>
</template>
