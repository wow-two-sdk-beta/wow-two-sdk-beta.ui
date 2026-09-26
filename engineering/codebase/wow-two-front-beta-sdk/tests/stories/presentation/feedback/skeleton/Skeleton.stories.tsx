import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Skeleton } from '@src/presentation/feedback/skeleton/Skeleton';
import { useRefresh } from '@src/query/UseRefresh';

const meta: Meta<typeof Skeleton> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Card: Story = {
  render: () => (
    <div className="w-72 space-y-3 rounded-md border border-neutral-200 p-4">
      <Skeleton shape="circle" className="h-12 w-12" />
      <Skeleton shape="text" className="w-3/4" />
      <Skeleton shape="text" className="w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  ),
};

/** A paragraph placeholder with a shorter last line. */
export const Paragraph: Story = {
  render: () => (
    <div className="w-80">
      <Skeleton.Text lines={4} />
    </div>
  ),
};

/** The shimmer motion: a light band sweeps across each placeholder. */
export const Shimmer: Story = {
  render: () => (
    <Skeleton.Group loading animation="shimmer" className="w-72 space-y-3 rounded-md border border-neutral-200 p-4">
      <Skeleton shape="circle" className="h-12 w-12" />
      <Skeleton.Text lines={2} />
    </Skeleton.Group>
  ),
};

function MetricCard() {
  const [value, setValue] = useState(16);
  // A refresh that answers instantly still shows the skeleton long enough to be seen.
  const { refresh, refreshing } = useRefresh(async () => setValue((current) => current + 1), { minDuration: 300 });
  return (
    <Skeleton.Group loading={refreshing} className="w-64 space-y-2 rounded-md border border-neutral-200 p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span>Memory</span>
        <Skeleton.Slot data-testid="value" className="font-medium">{value}%</Skeleton.Slot>
      </div>
      <Skeleton.Slot block>
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
      </Skeleton.Slot>
      <button type="button" className="text-sm underline" onClick={() => void refresh()}>
        Refresh
      </button>
    </Skeleton.Group>
  );
}

/** The skeleton-swap pattern: labels stay, values turn into placeholders while a refresh runs. */
export const SwapOnRefresh: Story = {
  render: () => <MetricCard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh' }));
    await expect(canvas.getByTestId('value')).toHaveAttribute('data-loading', 'true');
    await expect(canvas.getByText('Memory')).toBeVisible();
    await waitFor(() => expect(canvas.getByTestId('value')).not.toHaveAttribute('data-loading'));
    await expect(canvas.getByTestId('value')).toHaveTextContent('17%');
  },
};
