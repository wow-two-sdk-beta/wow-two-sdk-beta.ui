<script lang="ts">
/** Defines the props for {@link RouteAnnouncer}. */
export interface RouteAnnouncerProps {
  /** Whether to skip the focus reset and announcement on the very first mount. Default `true`. */
  skipInitial?: boolean;
}

/** Moves keyboard and screen-reader focus to the main content — the shell `<main>`, else any `<main>`, else the page `<h1>`. */
function focusMainContent(): void {
  const target =
    document.getElementById('app-shell-main') ??
    document.querySelector<HTMLElement>('main') ??
    document.querySelector<HTMLElement>('h1');
  if (!target) return;
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}
</script>

<script setup lang="ts">
import { onMounted, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { deepestHandleValue, resolveHandleValue } from './RouteHandles';

/**
 * Resets focus to the main content and announces the newly navigated page title through a polite,
 * visually-hidden live region; skips the first mount.
 *
 * Unlike the other root behaviors this stays a COMPONENT rather than becoming a router hook — it
 * owns a live region in the DOM, so it has to render.
 */
defineOptions({ name: 'RouteAnnouncer' });

const props = withDefaults(defineProps<RouteAnnouncerProps>(), { skipInitial: true });

const route = useRoute();
const message = shallowRef('');

// Keyed on `path` — not `fullPath` — so search/hash-only updates (a filter input syncing through
// `router.replace`) never yank focus back to main mid-interaction. React needed a ref to absorb
// StrictMode's double-invoked mount effect; a non-immediate watcher cannot double-fire.
let lastPath: string | null = null;

// `onMounted` never runs on the server, which is what this needs: it reads and focuses the DOM.
onMounted(() => {
  lastPath = props.skipInitial ? route.path : null;
  if (!props.skipInitial) announce(route.path);
});

watch(
  () => route.path,
  (path) => {
    if (lastPath === path) return;
    announce(path);
  },
);

function announce(path: string): void {
  lastPath = path;
  focusMainContent();
  message.value = deepestHandleValue(route, (handle) => resolveHandleValue(handle.title, route)) ?? document.title;
}
</script>

<template>
  <div aria-live="polite" aria-atomic="true" class="sr-only">{{ message }}</div>
</template>
