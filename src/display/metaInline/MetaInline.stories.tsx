import type { Meta, StoryObj } from '@storybook/react';
import { Copy, Download } from 'lucide-react';
import { Icon } from '../../icons';
import { Badge } from '../badge';
import { MetaInline } from './MetaInline';

const meta: Meta<typeof MetaInline> = {
  title: 'Display/MetaInline',
  component: MetaInline,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MetaInline>;

export const Default: Story = {
  render: () => (
    <MetaInline>
      <Badge variant="info">EN</Badge>
      <Badge variant="neutral">VTT</Badge>
      <Badge variant="success">complete</Badge>
    </MetaInline>
  ),
};

export const WithActions: Story = {
  render: () => (
    <MetaInline
      actions={
        <>
          <button
            type="button"
            className="rounded p-1 hover:bg-muted"
            aria-label="Copy"
          >
            <Icon icon={Copy} size={14} />
          </button>
          <button
            type="button"
            className="rounded p-1 hover:bg-muted"
            aria-label="Download"
          >
            <Icon icon={Download} size={14} />
          </button>
        </>
      }
    >
      <Badge variant="info">EN</Badge>
      <Badge variant="neutral">VTT</Badge>
      <Badge variant="success">complete</Badge>
    </MetaInline>
  ),
};
