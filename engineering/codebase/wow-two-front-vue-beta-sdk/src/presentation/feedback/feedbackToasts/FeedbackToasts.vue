<script lang="ts">
import type { FeedbackBus, PublishedNotice } from '../../../feedback';
import type { ToasterProps, ToastOptions } from '../toaster';

/**
 * The prop surface of `FeedbackToasts` — `bus`, plus every `Toaster` prop.
 *
 * The `ToasterProps` heritage is marked `@vue-ignore` so only `bus` becomes a
 * runtime prop and the rest arrive as attrs; the template hands those to
 * `<Toaster>`, which declares them and resolves them back into props. Consumers
 * still get the full checked surface, because the heritage is real to
 * TypeScript — it is only the SFC compiler's runtime-props pass that skips it.
 */
export interface FeedbackToastsProps extends /* @vue-ignore */ ToasterProps {
  /** The bus to render. Default: the app-wide `feedbackBus` singleton (what `notify()` publishes on). */
  bus?: FeedbackBus;
}

/** Maps a bus notice onto the imperative toast payload. `NoticeTone` is a subset of the toast `Severity` vocabulary, and `NoticeNode` is `ToastNode` — drift in either is a compile error. */
function toToastOptions(notice: PublishedNotice): ToastOptions {
  return {
    title: notice.title,
    description: notice.description,
    severity: notice.tone,
    duration: notice.durationMs,
    action: notice.action,
  };
}
</script>

<script setup lang="ts">
import { computed, useAttrs, watch } from 'vue';
import { feedbackBus } from '../../../feedback';
import Toaster from '../toaster/Toaster.vue';
import { toaster } from '../toaster';

/**
 * The `/feedback` bus → `Toaster` adapter: subscribes to the bus and forwards every notice into
 * the imperative `toaster.toast()` API, rendering the toast viewport itself (all `ToasterProps`
 * pass through). Mount once per app **in place of** a bare `<Toaster/>` — mounting both would
 * render every toast twice. Explicit opt-in wiring: nothing toasts until this (or another
 * subscriber) is mounted; notices published before mount are dropped, so mount it at the app root.
 */
defineOptions({ name: 'FeedbackToasts', inheritAttrs: false });

const props = defineProps<FeedbackToastsProps>();

const attrs = useAttrs();

/** React defaulted this in the destructure; a `computed` keeps the fallback reactive so a swapped `bus` re-subscribes. */
const bus = computed(() => props.bus ?? feedbackBus);

/*
 * React's `useEffect(() => bus.subscribe(...), [bus])`: `onCleanup` receives the
 * unsubscribe, so a changed `bus` drops the old subscription before opening the
 * new one, and scope disposal drops the last.
 */
watch(
  bus,
  (current, _previous, onCleanup) => {
    // Client-only, as the effect was: a server render has no viewport to forward into.
    if (typeof document === 'undefined') return;
    onCleanup(
      current.subscribe((notice) => {
        toaster.toast(toToastOptions(notice));
      }),
    );
  },
  { immediate: true },
);
</script>

<template>
  <!-- Every non-`bus` attr is a `Toaster` prop by construction — see `FeedbackToastsProps`. -->
  <Toaster v-bind="attrs" />
</template>
