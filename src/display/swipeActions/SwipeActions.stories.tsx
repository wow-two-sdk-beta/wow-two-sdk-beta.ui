import type { Meta, StoryObj } from '@storybook/react';
import { Archive, Pin, Trash } from 'lucide-react';
import { Icon } from '../../icons';
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
