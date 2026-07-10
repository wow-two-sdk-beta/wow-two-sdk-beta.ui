import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PullToRefresh } from './PullToRefresh';

const meta: Meta<typeof PullToRefresh> = {
  title: 'Layout/PullToRefresh',
  component: PullToRefresh,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PullToRefresh>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [items, setItems] = useState(() => Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`));
      return (
        <div className="h-96 w-80 overflow-hidden rounded-md border border-border">
          <PullToRefresh
            onRefresh={async () => {
              await new Promise((r) => setTimeout(r, 1200));
              setItems((prev) => [`New ${Math.floor(Math.random() * 1000)}`, ...prev]);
            }}
          >
            <ul className="divide-y divide-border">
              {items.map((label) => (
                <li key={label} className="bg-card px-4 py-3 text-sm">
                  {label}
                </li>
              ))}
            </ul>
          </PullToRefresh>
        </div>
      );
    }
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: PullToRefresh.tsx source.
 * The gesture is plain pointer events (pointerdown/move/up at scrollTop 0),
 * driveable with `userEvent.pointer`. State is read through the content
 * wrapper's translateY (asserted as computed matrix inside waitFor — harness
 * gotcha), the spinner's sr-only "Loading" text, and the polite live region
 * that announces "Refreshing". `onRefresh` resolution is held open by a
 * deferred promise so the refreshing window itself is assertable.
 * ------------------------------------------------------------------------- */

const deferredRefresh: { resolve?: () => void } = {};
const refreshSpy = fn(
  () =>
    new Promise<void>((resolve) => {
      deferredRefresh.resolve = resolve;
    }),
);

const Rows = () => (
  <ul className="divide-y divide-border">
    {Array.from({ length: 8 }, (_, i) => (
      <li key={i} className="bg-card px-4 py-3 text-sm">
        Row {i + 1}
      </li>
    ))}
  </ul>
);

/** Press near the top of the list → drag down by `dy` → release. */
const pullByPointer = async (target: HTMLElement, dy: number) => {
  const rect = target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const startY = rect.top + 4;
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target, coords: { clientX: x, clientY: startY } },
    { target, coords: { clientX: x, clientY: startY + dy / 2 } },
    { target, coords: { clientX: x, clientY: startY + dy } },
    { keys: '[/MouseLeft]', target, coords: { clientX: x, clientY: startY + dy } },
  ]);
};

/** The content wrapper whose inline translateY mirrors the pull distance. */
const contentWrapper = (canvas: ReturnType<typeof within>) =>
  canvas.getByText('Row 1').closest('div[style]') as HTMLElement;

export const PullPastThresholdTriggersRefresh: Story = {
  render: () => (
    <div className="h-64 w-72 overflow-hidden rounded-md border border-border">
      <PullToRefresh onRefresh={refreshSpy}>
        <Rows />
      </PullToRefresh>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // No stale-resolve reset needed: the spy overwrites `resolve` on every
    // call, and the play only resolves after asserting THIS run's call.
    refreshSpy.mockClear();
    const canvas = within(canvasElement);
    const content = contentWrapper(canvas);

    // 100px raw pull → eased 60 + 40×0.4 = 76 ≥ threshold(60) → refresh fires.
    await pullByPointer(canvas.getByText('Row 1'), 100);
    await waitFor(() => expect(refreshSpy).toHaveBeenCalledTimes(1));

    // While the promise is pending: content parks at the threshold offset,
    // the spinner is shown, and the polite live region announces.
    await waitFor(() =>
      expect(content).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 0, 60)' }),
    );
    await expect(canvas.getByText('Loading')).toBeInTheDocument();
    await expect(canvas.getByText('Refreshing')).toBeInTheDocument();

    // Resolving onRefresh settles everything back to rest.
    deferredRefresh.resolve?.();
    await waitFor(() =>
      expect(content).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 0, 0)' }),
    );
    await waitFor(() => expect(canvas.queryByText('Refreshing')).not.toBeInTheDocument());
    await expect(canvas.queryByText('Loading')).not.toBeInTheDocument();
    await expect(refreshSpy).toHaveBeenCalledTimes(1);
  },
};

export const ReleaseBelowThresholdSnapsBack: Story = {
  render: () => (
    <div className="h-64 w-72 overflow-hidden rounded-md border border-border">
      <PullToRefresh onRefresh={refreshSpy}>
        <Rows />
      </PullToRefresh>
    </div>
  ),
  play: async ({ canvasElement }) => {
    refreshSpy.mockClear();
    const canvas = within(canvasElement);
    const content = contentWrapper(canvas);

    // 30px < 60px threshold — releasing snaps shut without refreshing.
    await pullByPointer(canvas.getByText('Row 1'), 30);
    await waitFor(() =>
      expect(content).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 0, 0)' }),
    );
    await expect(refreshSpy).not.toHaveBeenCalled();
    await expect(canvas.queryByText('Refreshing')).not.toBeInTheDocument();
    await expect(canvas.queryByText('Loading')).not.toBeInTheDocument();
  },
};

const disabledRefreshSpy = fn();

export const DisabledIgnoresPullGesture: Story = {
  render: () => (
    <div className="h-64 w-72 overflow-hidden rounded-md border border-border">
      <PullToRefresh onRefresh={disabledRefreshSpy} isDisabled>
        <Rows />
      </PullToRefresh>
    </div>
  ),
  play: async ({ canvasElement }) => {
    disabledRefreshSpy.mockClear();
    const canvas = within(canvasElement);
    const content = contentWrapper(canvas);

    // A well-past-threshold drag is ignored entirely while disabled.
    await pullByPointer(canvas.getByText('Row 1'), 100);
    await expect(content).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 0, 0)' });
    await expect(disabledRefreshSpy).not.toHaveBeenCalled();
    await expect(canvas.queryByText('Loading')).not.toBeInTheDocument();
  },
};
