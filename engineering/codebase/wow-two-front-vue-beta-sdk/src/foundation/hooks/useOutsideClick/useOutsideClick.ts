import { toValue, watchPostEffect, type MaybeRefOrGetter } from 'vue';

/** One element source — a template ref, a plain element, or a getter that resolves to either. */
export type OutsideClickTarget = MaybeRefOrGetter<HTMLElement | null | undefined>;

/**
 * Fire `handler` when the user clicks outside any of the provided targets.
 * Uses `pointerdown` so it fires before focus shifts (avoids losing focus
 * inside an overlay before a click on a trigger registers).
 *
 * Pass a `useTemplateRef` (or an array of them) — each is resolved at event
 * time, so a target that mounts later is still honoured without re-attaching.
 */
export function useOutsideClick(
  targets: OutsideClickTarget | ReadonlyArray<OutsideClickTarget>,
  handler: (event: PointerEvent) => void,
  enabled: MaybeRefOrGetter<boolean> = true,
): void {
  // `Array.isArray` does not narrow a `ReadonlyArray` union, hence the assertions.
  const targetList: ReadonlyArray<OutsideClickTarget> = Array.isArray(targets)
    ? (targets as ReadonlyArray<OutsideClickTarget>)
    : [targets as OutsideClickTarget];

  watchPostEffect((onCleanup) => {
    if (!toValue(enabled) || typeof document === 'undefined') return;

    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node | null;
      if (!target) return;
      for (const candidate of targetList) {
        const element = toValue(candidate);
        if (element && element.contains(target)) return;
      }
      handler(e);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    onCleanup(() => document.removeEventListener('pointerdown', onPointerDown, true));
  });
}
