import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HoverCard } from '@src/presentation/overlays/hoverCard/HoverCard';

const meta: Meta<typeof HoverCard> = {
  title: 'Overlays/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <div className="p-24">
      <HoverCard>
        <HoverCard.Trigger>
          <a
            href="https://example.com"
            className="text-sm text-primary underline underline-offset-2"
          >
            @vercel
          </a>
        </HoverCard.Trigger>
        <HoverCard.Content>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background">
              ▲
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold">Vercel</h4>
              <p className="text-xs text-muted-foreground">
                The platform for frontend developers.
              </p>
            </div>
          </div>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
};

export const QuickOpen: Story = {
  render: () => (
    <div className="p-24">
      <HoverCard openDelay={150} closeDelay={150}>
        <HoverCard.Trigger>
          <button type="button" className="rounded-md border border-border px-3 py-1.5 text-sm">
            Hover me (fast)
          </button>
        </HoverCard.Trigger>
        <HoverCard.Content>
          <p className="text-sm">Pop-out content with custom delays.</p>
        </HoverCard.Content>
      </HoverCard>
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: HoverCard.tsx source.
 * The card portals to document.body → query via `canvasElement.ownerDocument
 * .body`; the panel carries no role → query by text. Open/close are
 * timer-delayed (openDelay/closeDelay, shortened here) and exit is
 * animation-deferred (Presence + pop-out) → all state flips poll via
 * `waitFor`. No scroll lock (non-modal surface — nothing to audit).
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <div className="p-24">
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCard.Trigger>
        <button type="button" className="rounded-md border border-border px-3 py-1.5 text-sm">
          Hover trigger
        </button>
      </HoverCard.Trigger>
      <HoverCard.Content>
        <p className="text-sm">Hover card content.</p>
      </HoverCard.Content>
    </HoverCard>
  </div>
);

export const OpensOnHoverClosesOnUnhover: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Hover trigger' });
    await userEvent.hover(trigger);

    // Opens after openDelay elapses.
    await waitFor(() => expect(body.getByText('Hover card content.')).toBeVisible());

    await userEvent.unhover(trigger);

    // Closes after closeDelay + the pop-out exit animation.
    await waitFor(() => expect(body.queryByText('Hover card content.')).not.toBeInTheDocument());
  },
};

export const OpensOnFocusClosesOnBlur: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Hover trigger' });

    // Keyboard access: tab onto the trigger — focus opens the card.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(body.getByText('Hover card content.')).toBeVisible());

    // Tabbing away blurs the trigger — the card closes.
    await userEvent.tab();
    await waitFor(() => expect(body.queryByText('Hover card content.')).not.toBeInTheDocument());
  },
};

export const ClosesOnEscape: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Hover trigger' });
    await userEvent.hover(trigger);
    await waitFor(() => expect(body.getByText('Hover card content.')).toBeVisible());

    // WCAG 1.4.13 — dismissible without moving the pointer.
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByText('Hover card content.')).not.toBeInTheDocument());
  },
};
