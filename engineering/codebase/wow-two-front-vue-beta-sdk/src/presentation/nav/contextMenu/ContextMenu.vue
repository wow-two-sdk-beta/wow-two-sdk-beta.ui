<script lang="ts">
/**
 * The prop surface of `ContextMenu`.
 *
 * React declared only `children`, which is the default slot here — leaving no
 * declared prop. The root owns its open state outright; there is no controlled
 * form to mirror.
 */
export type ContextMenuProps = Record<string, never>;
</script>

<script setup lang="ts">
import { onScopeDispose, provide, shallowRef } from 'vue';
import { contextMenuContextKey } from './ContextMenuContext';

/**
 * Renders only its slot, owning the open state and anchor point of the ContextMenu tree below.
 * React returned a bare context Provider, which has no element of its own.
 */
defineOptions({ name: 'ContextMenu', inheritAttrs: false });

/** The ContextMenu tree — `ContextMenuTrigger` and `ContextMenuContent`. React's `children`. */
defineSlots<{ default(): unknown }>();

const open = shallowRef(false);
const anchor = shallowRef<HTMLElement | null>(null);
const triggerEl = shallowRef<HTMLElement | null>(null);
const restoreFocus: { current: HTMLElement | null } = { current: null };
let restoreRaf = 0;

/** Detaches the outgoing body-appended virtual anchor before adopting the new one. */
function setAnchor(el: HTMLElement | null): void {
  const previous = anchor.value;
  if (previous && typeof document !== 'undefined' && previous.parentNode === document.body) {
    previous.remove();
  }
  anchor.value = el;
}

function setOpen(next: boolean): void {
  // The trigger is a non-focusable div, so there is no trigger to hand focus
  // back to (APG wants focus returned on close). The trigger captures the
  // pre-gesture active element into `restoreFocus` on pointerdown (the
  // browser's mousedown focus fixup may have already blurred it by the time
  // `contextmenu` fires); fall back to the current active element for
  // non-pointer opens.
  if (next && !open.value) {
    cancelAnimationFrame(restoreRaf);
    restoreFocus.current ??=
      document.activeElement instanceof HTMLElement && document.activeElement !== document.body
        ? document.activeElement
        : null;
  }
  open.value = next;
  if (next) return;

  setAnchor(null);
  const restoreTarget = restoreFocus.current;
  restoreFocus.current = null;
  // The menu stays mounted (and focus-trapped) through its exit animation,
  // yanking focus straight back into itself — so retry each frame until the
  // restore sticks (bounded; the exit lasts a few hundred ms at most).
  // Reopening cancels the loop.
  if (!restoreTarget) return;
  let attempts = 0;
  const tryRestore = (): void => {
    restoreTarget.focus();
    if (document.activeElement !== restoreTarget && attempts++ < 30) {
      restoreRaf = requestAnimationFrame(tryRestore);
    }
  };
  restoreRaf = requestAnimationFrame(tryRestore);
}

// Cancel a pending focus-restore loop, and drop the body-appended virtual
// anchor, if the tree unmounts mid-close.
onScopeDispose(() => {
  if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(restoreRaf);
  const current = anchor.value;
  if (current && typeof document !== 'undefined' && current.parentNode === document.body) {
    current.remove();
  }
});

provide(contextMenuContextKey, { open, setOpen, anchor, setAnchor, triggerEl, restoreFocus });
</script>

<template>
  <slot />
</template>
