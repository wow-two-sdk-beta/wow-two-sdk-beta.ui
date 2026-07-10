import { userEvent } from 'storybook/test';

export interface DragPointerOptions {
  /** Press position, viewport (client) coordinates. */
  from: { x: number; y: number };
  /** Release position, viewport (client) coordinates. */
  to: { x: number; y: number };
  /** `pointermove` segments interpolated between `from` and `to` (default 2). */
  steps?: number;
}

/**
 * Pointer-driven drag: press at `from`, interpolated moves, release at `to` —
 * native HTML5 drag-and-drop can't be synthesized from `storybook/test` events
 * (docs/testing.md → Harness learnings → "Native default actions don't fire
 * from synthetic events"), so drag surfaces must implement — and be tested
 * through — pointer events.
 */
export async function dragPointer(el: Element, options: DragPointerOptions): Promise<void> {
  const { from, to, steps = 2 } = options;
  const count = Math.max(1, Math.trunc(steps));
  const moves = Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / count;
    return {
      target: el,
      coords: { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t },
    };
  });
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target: el, coords: { x: from.x, y: from.y } },
    ...moves,
    { keys: '[/MouseLeft]', target: el, coords: { x: to.x, y: to.y } },
  ]);
}
