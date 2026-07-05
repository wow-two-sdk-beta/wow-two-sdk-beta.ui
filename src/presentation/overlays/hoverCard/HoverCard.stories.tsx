import type { Meta, StoryObj } from '@storybook/react';
import { HoverCard } from './HoverCard';

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
