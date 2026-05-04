import type { Meta, StoryObj } from '@storybook/react';
import { Edit, FileText, Mail, Share2 } from 'lucide-react';
import { Icon } from '../../icons';
import { SpeedDial, SpeedDialAction, SpeedDialTrigger } from './SpeedDial';

const meta: Meta = {
  title: 'Actions/SpeedDial',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial>
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} tooltip="Mail" />
        <SpeedDialAction aria-label="Edit" icon={<Icon icon={Edit} size={16} />} tooltip="Edit" />
        <SpeedDialAction aria-label="Share" icon={<Icon icon={Share2} size={16} />} tooltip="Share" />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
};

export const TopLeft: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial position="top-left">
        <SpeedDialAction aria-label="Note" icon={<Icon icon={FileText} size={16} />} tooltip="New note" />
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} tooltip="Mail" />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
};

export const RightDirection: Story = {
  render: () => (
    <div className="relative h-80 w-full rounded-md border border-dashed border-border">
      <SpeedDial position="bottom-left" direction="right">
        <SpeedDialAction aria-label="Mail" icon={<Icon icon={Mail} size={16} />} tooltip="Mail" />
        <SpeedDialAction aria-label="Edit" icon={<Icon icon={Edit} size={16} />} tooltip="Edit" />
        <SpeedDialAction aria-label="Share" icon={<Icon icon={Share2} size={16} />} tooltip="Share" />
        <SpeedDialTrigger aria-label="Open actions" />
      </SpeedDial>
    </div>
  ),
};
