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

/** One trapped scope's hook into the shared `focusin` listener. */
interface FocusScopeEntry {
  /** Pulls focus back inside when it lands outside this scope. */
  recover: (event: FocusEvent) => void;
}

/**
 * Active trapped scopes, most-recently-activated last — the same structure
 * Radix used to *pause* outer scopes, and the reason there is exactly one
 * document listener rather than one per scope.
 *
 * Nesting is what makes it necessary. A Popover inside a Modal is not DOM-nested
 * (both portal to `body`), so each scope reads focus in the other as an escape.
 * With a live listener per scope they alternate — modal pulls focus in, popover
 * pulls it back, and because `.focus()` dispatches `focusin` synchronously the
 * two recurse until the call stack blows. Topmost-only ends that: the scopes
 * below the top are paused, not unregistered, and resume the moment the one
 * above them pops.
 */
const scopeStack: Array<FocusScopeEntry> = [];

function onDocumentFocusIn(event: FocusEvent): void {
  scopeStack[scopeStack.length - 1]?.recover(event);
}

/** Pushes `entry` to the top, making it the scope that owns focus. A re-activation moves it up rather than duplicating it. */
function activateScope(entry: FocusScopeEntry): void {
  const index = scopeStack.indexOf(entry);
  if (index >= 0) scopeStack.splice(index, 1);
  scopeStack.push(entry);
  // One listener for the whole stack — attached with the first scope, dropped with the last.
  if (scopeStack.length === 1) document.addEventListener('focusin', onDocumentFocusIn);
}

/** Removes `entry`, restoring whichever scope sat below it as the owner. Safe to call twice. */
function deactivateScope(entry: FocusScopeEntry): void {
  const index = scopeStack.indexOf(entry);
  if (index < 0) return;
  scopeStack.splice(index, 1);
  if (scopeStack.length === 0) document.removeEventListener('focusin', onDocumentFocusIn);
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
 * dependency of the foundation layer for behaviour that is ~60 lines. Radix's
 * scope *stack* is kept, though: see `scopeStack` above.
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

/** Stable for this component's lifetime — it is the stack's identity for this scope. */
const entry: FocusScopeEntry = {
  recover: (event: FocusEvent) => {
    const container = containerEl();
    if (!container) return;
    const target = event.target as Node | null;
    if (target && container.contains(target)) return;
    focusFirst(container);
  },
};

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
  // Leave the stack *before* focus moves. While this scope is still the top,
  // its own `recover` would read the restore as an escape and yank focus
  // straight back in — and the scope below it must be the one that owns the
  // restored focus, which is exactly what popping hands over.
  deactivateScope(entry);
  const event = new CustomEvent('focusScope.autoFocusOnUnmount', {
    bubbles: false,
    cancelable: true,
  });
  props.onUnmountAutoFocus?.(event);
  if (!event.defaultPrevented) previouslyFocused?.focus?.();
  previouslyFocused = null;
});

// `trapped` guards the escape route Tab cannot cover — a click, or a
// programmatic focus, landing outside the scope. Activation is what puts this
// scope on top of `scopeStack`; only the top reacts to `focusin`.
watch(
  () => props.trapped,
  (trapped, _previous, onCleanup) => {
    if (!trapped || typeof document === 'undefined') return;
    activateScope(entry);
    onCleanup(() => deactivateScope(entry));
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
