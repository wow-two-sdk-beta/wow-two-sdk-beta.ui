import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';

const meta: Meta<typeof Link> = {
  title: 'Actions/Link',
  component: Link,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: { href: '#', children: 'Read the docs' },
};
export const Variants: Story = {
  render: () => (
    <div className="space-x-4">
      {(['default', 'subtle', 'muted'] as const).map((v) => (
        <Link key={v} href="#" variant={v}>{v} link</Link>
      ))}
    </div>
  ),
};
