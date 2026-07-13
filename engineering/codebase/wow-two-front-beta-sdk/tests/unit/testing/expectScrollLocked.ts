import { expect, waitFor } from 'storybook/test';

/**
 * Asserts body scroll is locked (`overflow: hidden`) — the regression guard for
 * the mount-scoped scroll-lock bug (lock must engage on OPEN, not on mount;
 * docs/testing.md → First-pass findings → "Modal scroll-lock is mount-scoped").
 */
export async function expectScrollLocked(doc: Document): Promise<void> {
  await waitFor(() => expect(doc.body).toHaveStyle({ overflow: 'hidden' }));
}
