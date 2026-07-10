import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BackToTopButton } from './BackToTopButton';

const meta: Meta<typeof BackToTopButton> = {
  title: 'Actions/BackToTopButton',
  component: BackToTopButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof BackToTopButton>;

export const Default: Story = {
  render: () => (
    <div>
      <div className="space-y-3 text-sm text-muted-foreground">
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i}>Paragraph {i + 1}. Scroll down to see the button appear.</p>
        ))}
      </div>
      <BackToTopButton threshold={300} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div>
      <div className="space-y-3 text-sm text-muted-foreground">
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i}>Paragraph {i + 1}.</p>
        ))}
      </div>
      <BackToTopButton threshold={300} label="Top" />
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: BackToTopButton.tsx behavior surface.
 * A scoped `scrollContainer` keeps the scroll deterministic in the headless
 * harness (the story iframe's window scroll depends on preview layout).
 * ------------------------------------------------------------------------- */

/* Stateful fixture — the ref callback re-renders so the effect re-binds from window to the element. */
function ScrollContainerFixture() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setContainer}
      data-testid="scroll-area"
      className="h-64 space-y-3 overflow-y-auto rounded-md border border-border p-4 text-sm text-muted-foreground"
    >
      {Array.from({ length: 40 }, (_, i) => (
        <p key={i}>Row {i + 1}. Scroll to reveal the button.</p>
      ))}
      <BackToTopButton threshold={200} scrollContainer={container} />
    </div>
  );
}

/** Hidden under the threshold; appears past it; click smooth-scrolls back to 0; hides again. */
export const AppearsOnScrollAndReturnsToTop: Story = {
  render: () => <ScrollContainerFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const area = canvas.getByTestId('scroll-area');

    /* Below the threshold the button doesn't render at all. */
    await expect(canvas.queryByRole('button', { name: 'Back to top' })).toBe(null);

    /* Scroll past the threshold — the scroll event reveals the button. */
    area.scrollTop = 600;
    const button = await waitFor(() => canvas.getByRole('button', { name: 'Back to top' }));
    await expect(button).toBeVisible();

    /* Click scrolls the container to top — smooth scroll animates, so poll. */
    await userEvent.click(button);
    await waitFor(() => expect(area.scrollTop).toBe(0), { timeout: 3000 });

    /* Back under the threshold — the button unmounts again. */
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Back to top' })).toBe(null),
    );
  },
};
