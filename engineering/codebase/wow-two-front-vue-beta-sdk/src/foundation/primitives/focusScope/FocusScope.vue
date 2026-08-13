<script lang="ts">
export interface FocusScopeProps {
  /** Wrap Tab / Shift+Tab at the scope's edges. Default false. */
  loop?: boolean;

  /** Keep focus inside the scope — focus that escapes is pulled back. Default false. */
  trapped?: boolean;

  /** Fires before the scope auto-focuses on mount; `preventDefault()` to keep focus where it is. */
  onMountAutoFocus?: (event: CustomEvent) => void;

  /** Fires before focus is restored on unmount; `preventDefault()` to keep focus where it is. */
  onUnmountAutoFocus?: (event: CustomEvent) => void;

  /** Merge into the single slot child instead of rendering a wrapper div. */
  asChild?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

function isVisible(el: HTMLElement): boolean {
  // checkVisibility covers display/visibility/content-visibility; the
  // getClientRects fallback (older engines) still includes position:fixed
  // elements, which `offsetParent !== null` would wrongly exclude.
  return el.checkVisibility?.() ?? el.getClientRects().length > 0;
}

function getFocusable(container: HTMLElement): ReadonlyArray<HTMLElement> {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getAttribute('aria-hidden') !== 'true' && isVisible(el),
  );
}
</script>

<script setup lang="ts">
import { onMounted, onScopeDispose, useTemplateRef, watch, type ComponentPublicInstance } from 'vue';
import { Primitive } from '../slot';

/**
 * Focus-management scope. On unmount, returns focus to the previously
 * focused element. Pass `loop` to wrap Tab navigation; `trapped` to trap
 * focus within children (defaults to false — focus may leave the scope
 * unless explicitly trapped).
 *
 * The React original wrapped `@radix-ui/react-focus-scope`. Radix ships no Vue
 * package, so the trap is hand-rolled here on the same technique the house
 * already uses in `hooks/useFocusTrap` — the alternative, pulling in `reka-ui`
 * for one component, would add a whole component library as a runtime
 * dependency of the foundation layer for behaviour that is ~60 lines.
 *
 * The mount / unmount auto-focus callbacks receive a cancelable `CustomEvent`,
 * matching Radix's `onMountAutoFocus` / `onUnmountAutoFocus` contract:
 * `preventDefault()` suppresses the automatic focus move.
 */
defineOptions({ name: 'FocusScope' });

const props = withDefaults(defineProps<FocusScopeProps>(), {
  loop: false,
  trapped: false,
  asChild: false,
});

const scope = useTemplateRef<ComponentPublicInstance>('scope');

/** `$el` is not reactive, so the node is read on demand rather than cached in a computed. */
function containerEl(): HTMLElement | null {
  const el = scope.value?.$el;
  return el instanceof HTMLElement ? el : null;
}

function focusFirst(container: HTMLElement): void {
  const focusable = getFocusable(container);
  if (focusable.length > 0) focusable[0]?.focus();
  // Nothing focusable inside — the container itself takes the focus, which is
  // what `tabindex="-1"` on it is for.
  else container.focus();
}

let previouslyFocused: HTMLElement | null = null;

onMounted(() => {
  const container = containerEl();
  if (!container) return;
  previouslyFocused = document.activeElement as HTMLElement | null;
  if (container.contains(previouslyFocused)) return;
  const event = new CustomEvent('focusScope.autoFocusOnMount', {
    bubbles: false,
    cancelable: true,
  });
  props.onMountAutoFocus?.(event);
  container.dispatchEvent(event);
  if (!event.defaultPrevented) focusFirst(container);
});

onScopeDispose(() => {
  const event = new CustomEvent('focusScope.autoFocusOnUnmount', {
    bubbles: false,
    cancelable: true,
  });
  props.onUnmountAutoFocus?.(event);
  if (!event.defaultPrevented) previouslyFocused?.focus?.();
  previouslyFocused = null;
});

// `trapped` guards the escape route Tab cannot cover — a click, or a
// programmatic focus, landing outside the scope.
watch(
  () => props.trapped,
  (trapped, _previous, onCleanup) => {
    if (!trapped || typeof document === 'undefined') return;
    const onFocusIn = (event: FocusEvent) => {
      const container = containerEl();
      if (!container) return;
      const target = event.target as Node | null;
      if (target && container.contains(target)) return;
      focusFirst(container);
    };
    document.addEventListener('focusin', onFocusIn);
    onCleanup(() => document.removeEventListener('focusin', onFocusIn));
  },
  { immediate: true },
);

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  if (!props.loop && !props.trapped) return;
  const container = containerEl();
  if (!container) return;
  const items = getFocusable(container);
  if (items.length === 0) {
    if (props.trapped) event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) return;
  const active = document.activeElement;
  const atEdge = event.shiftKey ? active === first : active === last;
  if (!atEdge) return;
  if (props.loop) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (props.trapped) {
    // Trapped without looping — the edge is a wall, not a wrap.
    event.preventDefault();
  }
}
</script>

<template>
  <Primitive ref="scope" :as-child="props.asChild" tabindex="-1" @keydown="onKeydown">
    <slot />
  </Primitive>
</template>
