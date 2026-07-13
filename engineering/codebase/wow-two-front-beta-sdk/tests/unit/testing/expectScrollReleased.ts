import { expect, waitFor } from 'storybook/test';

/**
 * Asserts body scroll is NOT locked, polling — release rides the exit animation
 * (Presence unmount), so it lands late; also guards "mounted closed must never
 * lock" (docs/testing.md → First-pass findings → "Modal scroll-lock is
 * mount-scoped, not open-scoped").
 */
export async function expectScrollReleased(doc: Document): Promise<void> {
  await waitFor(() => expect(doc.body).not.toHaveStyle({ overflow: 'hidden' }));
}
