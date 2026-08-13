import { toValue, watchPostEffect, type MaybeRefOrGetter } from 'vue';

/**
 * Run `callback` whenever the referenced element's size changes. The effect is
 * post-flush, so the element is in the DOM (and laid out) before the observer
 * attaches. Disconnects automatically when the element changes, `enabled`
 * flips, or the scope is disposed.
 *
 * Takes the element as a ref or getter rather than handing one back, so the
 * caller keeps ownership of its `useTemplateRef`.
 */
export function useResizeObserver<T extends HTMLElement = HTMLElement>(
  target: MaybeRefOrGetter<T | null | undefined>,
  callback: (entry: ResizeObserverEntry) => void,
  enabled: MaybeRefOrGetter<boolean> = true,
): void {
  watchPostEffect((onCleanup) => {
    const element = toValue(target);
    if (!toValue(enabled) || !element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) callback(entry);
    });
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });
}
