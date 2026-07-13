import { expect, waitFor } from 'storybook/test';

/**
 * Asserts the queried element leaves the document, polling past the exit
 * animation — Presence defers unmount until the animation ends, so close
 * assertions must `waitFor` (docs/testing.md → Harness learnings → "Portals …
 * close assertions need waitFor (exit animations)").
 *
 * Pass a query (`() => body.queryByRole('dialog')`), not a captured node —
 * it re-runs on every poll.
 */
export async function expectDismissed(
  query: () => HTMLElement | null,
  options?: { timeout?: number; interval?: number },
): Promise<void> {
  await waitFor(() => expect(query()).not.toBeInTheDocument(), options);
}
