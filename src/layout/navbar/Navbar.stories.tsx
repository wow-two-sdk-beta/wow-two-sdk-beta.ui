import type { Meta, StoryObj } from '@storybook/react';
import { Navbar } from './Navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Layout/Navbar',
  component: Navbar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Navbar>;

const Brand = () => <span className="font-semibold">smart-qr</span>;

const Links = () => (
  <nav className="flex items-center gap-4 text-sm text-muted-foreground">
    <a href="#">Pricing</a>
    <a href="#">Docs</a>
    <a href="#">Blog</a>
  </nav>
);

const Actions = () => (
  <div className="flex items-center gap-2 text-sm">
    <button className="rounded-md px-3 py-1.5">Sign in</button>
    <button className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground">
      Get started
    </button>
  </div>
);

export const StartEnd: Story = {
  args: {
    start: <Brand />,
    end: <Actions />,
  },
};

export const ThreeSlots: Story = {
  args: {
    start: <Brand />,
    center: <Links />,
    end: <Actions />,
  },
};

export const Tinted: Story = {
  args: {
    tone: 'primary',
    start: <Brand />,
    end: <Actions />,
  },
};

export const Sticky: Story = {
  render: () => (
    <div className="h-64 overflow-y-auto">
      <Navbar sticky start={<Brand />} end={<Actions />} />
      <div className="space-y-3 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-muted-foreground">Scroll content line {i + 1}</p>
        ))}
      </div>
    </div>
  ),
};
