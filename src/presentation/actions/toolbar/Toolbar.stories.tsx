import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic, Underline, Link as LinkIcon } from 'lucide-react';
import { Toolbar } from './Toolbar';

const meta: Meta<typeof Toolbar> = {
  title: 'Actions/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Formatting">
      <Toolbar.Button aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Link href="#">
        <LinkIcon className="h-4 w-4" />
      </Toolbar.Link>
    </Toolbar>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Toolbar aria-label="Vertical formatting" orientation="vertical">
      <Toolbar.Button aria-label="Bold">
        <Bold className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Button aria-label="Italic">
        <Italic className="h-4 w-4" />
      </Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Button aria-label="Underline">
        <Underline className="h-4 w-4" />
      </Toolbar.Button>
    </Toolbar>
  ),
};
