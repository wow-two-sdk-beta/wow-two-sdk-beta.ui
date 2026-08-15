<script lang="ts">
import type { ElementTag } from '../../../foundation/utils';

export interface TypewriterProps {
  /** The phrase, or the phrases to cycle through. */
  text: string | string[];

  /** The ms between typed characters. Default `60`. */
  typeSpeed?: number;

  /** The ms between deleted characters. Default `40`. */
  deleteSpeed?: number;

  /** The ms held on a completed phrase before deleting. Default `1500`. */
  pauseBetween?: number;

  /** The cycle-forever flag. Defaults to `true` when more than one phrase was given. */
  canLoop?: boolean;

  /** The blinking caret. Default `true`. */
  hasCursor?: boolean;

  /** The caret glyph. Default `│`. */
  cursorChar?: string;

  /** The rendered tag. Default `span`. */
  as?: ElementTag;
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef, watch } from 'vue';
import { cn } from '../../../foundation/utils';
import { useReducedMotion } from '../../../foundation/hooks';

/**
 * Char-by-char typewriter. Single string types once; array of strings cycles
 * through (type → pause → delete → next). `prefers-reduced-motion` short-
 * circuits to the full string.
 */
defineOptions({ name: 'Typewriter', inheritAttrs: false });

const props = withDefaults(defineProps<TypewriterProps>(), {
  typeSpeed: 60,
  deleteSpeed: 40,
  pauseBetween: 1500,
  // `undefined` is meaningful — it falls back to `phrases.length > 1`, and Vue
  // would otherwise cast an absent Boolean prop to `false`.
  canLoop: undefined,
  hasCursor: true,
  cursorChar: '│',
  as: 'span',
});

const attrs = useAttrs();
const el = useTemplateRef<HTMLElement>('el');
/* Called before the lifecycle hooks below so its own `onMounted` subscription
   lands first and the flag is already settled when `step` first runs. */
const reducedMotion = useReducedMotion();

const phrases = computed(() => (Array.isArray(props.text) ? props.text : [props.text]));
const shouldLoop = computed(() => props.canLoop ?? phrases.value.length > 1);

const phraseIndex = ref(0);
const charIndex = ref(0);
const deleting = ref(false);

/* React's `useEffect` re-ran on every state / timing change and cleared its
   pending timeout on the way out. Driven from `onMounted` rather than an
   `immediate` watcher so `window.setTimeout` is never touched on the server. */
let timer: number | undefined;

function clearTimer(): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
    timer = undefined;
  }
}

function step(): void {
  clearTimer();
  if (reducedMotion.value) return;

  const current = phrases.value[phraseIndex.value] ?? '';

  if (!deleting.value) {
    // Typing phase.
    if (charIndex.value < current.length) {
      timer = window.setTimeout(() => {
        charIndex.value += 1;
      }, props.typeSpeed);
    } else {
      // Done typing this phrase.
      if (phrases.value.length === 1 && !shouldLoop.value) return;
      timer = window.setTimeout(() => {
        deleting.value = true;
      }, props.pauseBetween);
    }
    return;
  }

  // Deleting phase.
  if (charIndex.value > 0) {
    timer = window.setTimeout(() => {
      charIndex.value -= 1;
    }, props.deleteSpeed);
    return;
  }

  // Move to next phrase.
  const nextIndex = (phraseIndex.value + 1) % phrases.value.length;
  if (!shouldLoop.value && nextIndex === 0) return;
  deleting.value = false;
  phraseIndex.value = nextIndex;
}

onMounted(step);

watch(
  [
    charIndex,
    deleting,
    phraseIndex,
    phrases,
    shouldLoop,
    reducedMotion,
    () => props.typeSpeed,
    () => props.deleteSpeed,
    () => props.pauseBetween,
  ],
  step,
);

onBeforeUnmount(clearTimer);

const fullText = computed(() =>
  reducedMotion.value
    ? Array.isArray(props.text)
      ? (props.text[0] ?? '')
      : props.text
    : (phrases.value[phraseIndex.value] ?? '').slice(0, charIndex.value),
);

const hasCursor = computed(() => props.hasCursor && !reducedMotion.value);

const classes = computed(() => cn('inline-block', attrs.class as string | undefined));

/** Everything but `class`, which is re-applied through `cn` above. */
const rest = computed(() => {
  const { class: _class, ...others } = attrs;
  return others;
});

defineExpose({ el });
</script>

<template>
  <!-- Text and caret sit flush: a newline between them would condense to a
       rendered space that the React original never emitted. -->
  <component :is="props.as" ref="el" v-bind="rest" :class="classes"
    >{{ fullText
    }}<span
      v-if="hasCursor"
      aria-hidden="true"
      class="ml-0.5 inline-block motion-safe:animate-[blink-caret_1s_step-end_infinite]"
      >{{ props.cursorChar }}</span
    ></component
  >
</template>
