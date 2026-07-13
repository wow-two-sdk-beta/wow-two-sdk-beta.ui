import { expect, waitFor } from 'storybook/test';

/**
 * Asserts DOM focus lands on `el`, polling — focus restore (FocusScope on
 * unmount) and roving-focus moves settle only after Presence teardown / rAF,
 * so a bare `toHaveFocus` races the exit animation (docs/testing.md → Harness
 * learnings: close/focus assertions need `waitFor`).
 */
export async function expectFocusReturns(el: Element): Promise<void> {
  await waitFor(() => expect(el).toHaveFocus());
}
