<script lang="ts">
/**
 * Matches the contract guard every compound part raises when it is mounted without
 * its parent — `"Tabs.* must be used inside <Tabs>"`, `"Sortable.Handle must be
 * rendered inside <Sortable.Item>."`, `"Overlay chrome subcomponents must be used
 * inside an OverlayChromeProvider"`.
 *
 * The auto-mounted tail bare-mounts every uncurated export, so these fire by design.
 * Rendering them in the same red as a real crash made ~20 working components read as
 * broken; matching them lets the card say "this is the guard doing its job" instead.
 */
const GUARD_MESSAGE = /must be (?:used|rendered) inside/i;
</script>

<script setup lang="ts">
import { computed, onErrorCaptured, ref } from 'vue';

/**
 * Wraps one component's demo in a labelled card with a render-error boundary.
 *
 * A gallery is one long page: without the boundary, a single component throwing
 * blanks every section below it and the run reports nothing. Caught errors are
 * rendered in place, so the page keeps scrolling and the failure is visible
 * exactly where it happened.
 */
defineProps<{
  /** The component (or cluster) this card shows. */
  name: string;
  /** Optional one-line note — what the demo is proving. */
  note?: string;
  /** Renders the card body on a flat background rather than the card surface. */
  bare?: boolean;
  /**
   * Spans every column of the enclosing auto-fill grid.
   *
   * A matrix wider than ~6 columns squeezed into a 320px track grows an inner
   * horizontal scrollbar, and two axes you have to scroll between cannot be
   * compared — which is the entire job of a matrix.
   */
  isWide?: boolean;
}>();

const message = ref<string | null>(null);
const stack = ref<string | null>(null);

/** True when the caught error is a compound part's contract guard, not a crash. */
const isGuard = computed(() => message.value !== null && GUARD_MESSAGE.test(message.value));

/*
 * Keeps the FIRST error, not the last.
 *
 * A component whose `setup()` throws never produces its setup bindings, so Vue
 * goes on to render it and the template dies a second time on
 * `$setup.<binding>` — a meaningless `Cannot read properties of undefined`.
 * That secondary TypeError arrives last and would overwrite the real message
 * (e.g. "must be used inside <Modal>"), which is the only one worth reading.
 */
onErrorCaptured((err) => {
  if (message.value === null) {
    message.value = err instanceof Error ? err.message : String(err);
    stack.value = err instanceof Error ? (err.stack ?? null) : null;
  }
  return false;
});
</script>

<template>
  <section class="rounded-lg border border-border bg-card" :class="isWide && 'col-span-full'">
    <header class="flex items-baseline gap-2 border-b border-border px-3 py-1.5">
      <h3 class="font-mono text-[13px] font-semibold text-foreground">{{ name }}</h3>
      <p v-if="note" class="truncate text-[11px] text-subtle-foreground">{{ note }}</p>
    </header>

    <!-- Guard: expected, and the message IS the demo. No stack — there is no bug to trace. -->
    <div
      v-if="message !== null && isGuard"
      class="px-3 py-2 text-[11px] text-subtle-foreground"
      data-demo-guard
    >
      <span class="font-medium text-foreground">contract guard — expected.</span>
      Bare-mounted without its parent.
      <span class="mt-1 block font-mono text-[11px]">{{ message }}</span>
    </div>

    <div
      v-else-if="message !== null"
      class="whitespace-pre-wrap px-3 py-2 font-mono text-[11px] text-destructive"
      data-demo-error
    >
      {{ stack ?? message }}
    </div>

    <div v-else class="p-3" :class="bare ? '' : 'text-foreground'">
      <slot />
    </div>
  </section>
</template>
