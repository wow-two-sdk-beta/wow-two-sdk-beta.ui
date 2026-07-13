import { within } from 'storybook/test';

/**
 * Query scope for portalled UI — overlays render into `document.body`, not the
 * story canvas, so canvas-scoped queries never see them (docs/testing.md →
 * Harness learnings → "Portals": query via `canvasElement.ownerDocument.body`).
 */
export function portal(canvasElement: HTMLElement): ReturnType<typeof within> {
  return within(canvasElement.ownerDocument.body);
}
