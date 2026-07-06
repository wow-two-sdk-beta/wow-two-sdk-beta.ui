import type { Meta, StoryObj } from '@storybook/react';
import { Archive, Pin, Trash } from 'lucide-react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Icon } from '../../../foundation/icons';
import { SwipeActions } from './SwipeActions';

const meta: Meta<typeof SwipeActions> = {
  title: 'Display/SwipeActions',
  component: SwipeActions,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SwipeActions>;

const ActionButton = ({
  bg,
  icon,
  label,
  onClick,
}: {
  bg: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-white ${bg}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const Default: Story = {
  render: () => (
    <div className="w-[28rem] divide-y divide-border rounded-md border border-border bg-card">
      {Array.from({ length: 4 }, (_, i) => (
        <SwipeActions
          key={i}
          left={
            <ActionButton
              bg="bg-primary"
              icon={<Icon icon={Pin} size={16} />}
              label="Pin"
              onClick={() => alert(`Pin ${i + 1}`)}
            />
          }
          right={
            <>
              <ActionButton
                bg="bg-warning"
                icon={<Icon icon={Archive} size={16} />}
                label="Archive"
                onClick={() => alert(`Archive ${i + 1}`)}
              />
              <ActionButton
                bg="bg-destructive"
                icon={<Icon icon={Trash} size={16} />}
                label="Delete"
                onClick={() => alert(`Delete ${i + 1}`)}
              />
            </>
          }
        >
          <div className="flex items-center gap-3 p-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="text-sm font-medium">Email subject {i + 1}</div>
              <div className="text-xs text-muted-foreground">Preview text…</div>
            </div>
          </div>
        </SwipeActions>
      ))}
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: SwipeActions.tsx source.
 * The gesture is plain pointer events (pointerdown/move/up), driveable with
 * `userEvent.pointer`. Open/closed state is asserted through the a11y tree:
 * action containers carry aria-hidden until their side snaps open.
 * ------------------------------------------------------------------------- */

const pinSpy = fn();
const archiveSpy = fn();
const deleteSpy = fn();

const interactionRender = () => (
  <div className="w-[28rem] rounded-md border border-border bg-card">
    <SwipeActions
      left={
        <ActionButton
          bg="bg-primary"
          icon={<Icon icon={Pin} size={16} />}
          label="Pin"
          onClick={pinSpy}
        />
      }
      /* Array shape: countNodes() sizes one slot per entry. Fragment children
         flatten to the same count — see FragmentActionsGetFullSnapWidth. */
      right={[
        <ActionButton
          key="archive"
          bg="bg-warning"
          icon={<Icon icon={Archive} size={16} />}
          label="Archive"
          onClick={archiveSpy}
        />,
        <ActionButton
          key="delete"
          bg="bg-destructive"
          icon={<Icon icon={Trash} size={16} />}
          label="Delete"
          onClick={deleteSpy}
        />,
      ]}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="text-sm font-medium">Swipe row</div>
      </div>
    </SwipeActions>
  </div>
);

/** Press → horizontal drag by `dx` → release, in client coordinates from the row centre. */
const swipeByPointer = async (row: HTMLElement, dx: number) => {
  const rect = row.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target: row, coords: { clientX: startX, clientY: y } },
    { target: row, coords: { clientX: startX + dx / 2, clientY: y } },
    { target: row, coords: { clientX: startX + dx, clientY: y } },
    { keys: '[/MouseLeft]', target: row, coords: { clientX: startX + dx, clientY: y } },
  ]);
};

export const SwipeLeftRevealsRightActions: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    deleteSpy.mockClear();
    const canvas = within(canvasElement);
    const row = canvas.getByText('Swipe row');

    // Closed: action slots are aria-hidden, unreachable by role.
    await expect(canvas.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

    // Drag past the 60px threshold → snaps open to the full right-actions width.
    await swipeByPointer(row, -120);
    const deleteButton = await canvas.findByRole('button', { name: 'Delete' });
    await expect(canvas.getByRole('button', { name: 'Archive' })).toBeVisible();
    // Row content settles at the two-action width (2 × 72px) once the snap
    // transition finishes (computed transform → matrix form).
    await waitFor(() =>
      expect(row.closest('div[style]')).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, -144, 0)' }),
    );

    // Revealed action buttons are live.
    await userEvent.click(deleteButton);
    await expect(deleteSpy).toHaveBeenCalledTimes(1);
  },
};

export const ReleaseBelowThresholdSnapsBack: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByText('Swipe row');

    // 40px < 60px threshold — the row snaps shut on release.
    await swipeByPointer(row, -40);
    await expect(canvas.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(row.closest('div[style]')).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 0, 0)' }),
    );
  },
};

export const TapClosesOpenRow: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByText('Swipe row');

    await swipeByPointer(row, -120);
    await canvas.findByRole('button', { name: 'Delete' });

    // A plain tap (no horizontal travel) on the row body closes it again.
    await userEvent.click(row);
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(row.closest('div[style]')).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 0, 0)' }),
    );
  },
};

/* Fragment fixture — the shipped Default story wraps its two right actions in
   <>…</>; countNodes() flattens fragments so they size two slots (2 × 72px),
   identical to the array fixture above. Before the flattening fix a fragment
   counted as one node and squeezed both actions into a single slot. */
export const FragmentActionsGetFullSnapWidth: Story = {
  render: () => (
    <div className="w-[28rem] rounded-md border border-border bg-card">
      <SwipeActions
        right={
          <>
            <ActionButton
              bg="bg-warning"
              icon={<Icon icon={Archive} size={16} />}
              label="Archive"
              onClick={archiveSpy}
            />
            <ActionButton
              bg="bg-destructive"
              icon={<Icon icon={Trash} size={16} />}
              label="Delete"
              onClick={deleteSpy}
            />
          </>
        }
      >
        <div className="flex items-center gap-3 p-3">
          <div className="text-sm font-medium">Swipe row</div>
        </div>
      </SwipeActions>
    </div>
  ),
  play: async ({ canvasElement }) => {
    archiveSpy.mockClear();
    const canvas = within(canvasElement);
    const row = canvas.getByText('Swipe row');

    await swipeByPointer(row, -120);
    const archiveButton = await canvas.findByRole('button', { name: 'Archive' });
    await expect(canvas.getByRole('button', { name: 'Delete' })).toBeVisible();
    // Two fragment children → two slots: the row snaps to -144px, not -72px.
    await waitFor(() =>
      expect(row.closest('div[style]')).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, -144, 0)' }),
    );

    await userEvent.click(archiveButton);
    await expect(archiveSpy).toHaveBeenCalledTimes(1);
  },
};

export const SwipeRightRevealsLeftActions: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    pinSpy.mockClear();
    const canvas = within(canvasElement);
    const row = canvas.getByText('Swipe row');

    await expect(canvas.queryByRole('button', { name: 'Pin' })).not.toBeInTheDocument();

    // Drag right past the threshold (offset clamps to the one-action width).
    await swipeByPointer(row, 110);
    const pinButton = await canvas.findByRole('button', { name: 'Pin' });
    await waitFor(() =>
      expect(row.closest('div[style]')).toHaveStyle({ transform: 'matrix(1, 0, 0, 1, 72, 0)' }),
    );

    await userEvent.click(pinButton);
    await expect(pinSpy).toHaveBeenCalledTimes(1);
  },
};
