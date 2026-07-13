import { expect, waitFor } from 'storybook/test';

/**
 * Asserts `el` is visible, polling past the enter animation — pop-in keyframes
 * start at `opacity: 0`, so a bare `toBeVisible` right after `findByRole` flakes
 * (docs/testing.md → Harness learnings → "Enter animations start at opacity:0").
 */
export async function expectVisible(el: Element): Promise<void> {
  await waitFor(() => expect(el).toBeVisible());
}
