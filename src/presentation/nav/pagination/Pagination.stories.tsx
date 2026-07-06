import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Nav/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [page, setPage] = useState(5);
      return <Pagination total={20} page={page} onPageChange={setPage} />;
    };
    return <Demo />;
  },
};

export const WithoutFirstLast: Story = {
  render: () => {
    const Demo = () => {
      const [page, setPage] = useState(5);
      return <Pagination total={20} page={page} onPageChange={setPage} hideFirstLast />;
    };
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Pagination.tsx. Stateless component —
 * a stateful wrapper feeds `page` back so aria-current moves; the module-
 * level spy records every `onPageChange` call and is cleared at play start
 * (stories share the module). All queries stay inside the canvas (no portal).
 * ------------------------------------------------------------------------- */

const onPageChange = fn();

function StatefulDemo({ initial, total }: { initial: number; total: number }) {
  const [page, setPage] = useState(initial);
  return (
    <Pagination
      total={total}
      page={page}
      onPageChange={(p) => {
        onPageChange(p);
        setPage(p);
      }}
    />
  );
}

export const PageClickFiresOnPageChange: Story = {
  render: () => <StatefulDemo initial={5} total={20} />,
  play: async ({ canvasElement }) => {
    onPageChange.mockClear();
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: '5' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await userEvent.click(canvas.getByRole('button', { name: '6' }));

    await expect(onPageChange).toHaveBeenCalledTimes(1);
    await expect(onPageChange).toHaveBeenCalledWith(6);
    // aria-current follows the controlled page.
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '6' })).toHaveAttribute('aria-current', 'page'),
    );
    await expect(canvas.getByRole('button', { name: '5' })).not.toHaveAttribute('aria-current');
  },
};

export const PrevNextFirstLastNavigate: Story = {
  render: () => <StatefulDemo initial={5} total={20} />,
  play: async ({ canvasElement }) => {
    onPageChange.mockClear();
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }));
    await expect(onPageChange).toHaveBeenLastCalledWith(4);

    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(onPageChange).toHaveBeenLastCalledWith(5);

    await userEvent.click(canvas.getByRole('button', { name: 'First page' }));
    await expect(onPageChange).toHaveBeenLastCalledWith(1);

    await userEvent.click(canvas.getByRole('button', { name: 'Last page' }));
    await expect(onPageChange).toHaveBeenLastCalledWith(20);

    await expect(onPageChange).toHaveBeenCalledTimes(4);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: '20' })).toHaveAttribute('aria-current', 'page'),
    );
  },
};

export const EdgesDisableControls: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Pagination aria-label="First page pagination" total={10} page={1} onPageChange={onPageChange} />
      <Pagination aria-label="Last page pagination" total={10} page={10} onPageChange={onPageChange} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    onPageChange.mockClear();
    const canvas = within(canvasElement);

    const atFirst = within(canvas.getByRole('navigation', { name: 'First page pagination' }));
    await expect(atFirst.getByRole('button', { name: 'First page' })).toBeDisabled();
    await expect(atFirst.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(atFirst.getByRole('button', { name: 'Next page' })).toBeEnabled();
    await expect(atFirst.getByRole('button', { name: 'Last page' })).toBeEnabled();

    const atLast = within(canvas.getByRole('navigation', { name: 'Last page pagination' }));
    await expect(atLast.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await expect(atLast.getByRole('button', { name: 'Last page' })).toBeDisabled();
    await expect(atLast.getByRole('button', { name: 'First page' })).toBeEnabled();
    await expect(atLast.getByRole('button', { name: 'Previous page' })).toBeEnabled();

    // Disabled buttons are unclickable (`pointer-events: none` — Storybook's
    // userEvent refuses the interaction); the enabled path still fires.
    await userEvent.click(atFirst.getByRole('button', { name: 'Next page' }));
    await expect(onPageChange).toHaveBeenCalledTimes(1);
    await expect(onPageChange).toHaveBeenCalledWith(2);
  },
};

export const EllipsisForLargePageCounts: Story = {
  render: () => <Pagination total={50} page={25} onPageChange={onPageChange} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Window: 1 … 24 25 26 … 50 — boundary + sibling pages only.
    for (const name of ['1', '24', '25', '26', '50']) {
      await expect(canvas.getByRole('button', { name })).toBeVisible();
    }
    await expect(canvas.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '23' })).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: '27' })).not.toBeInTheDocument();
    await expect(canvas.getAllByText('…')).toHaveLength(2);
    await expect(canvas.getByRole('button', { name: '25' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // 5 page buttons + first/prev/next/last chrome.
    await expect(canvas.getAllByRole('button')).toHaveLength(9);
  },
};
