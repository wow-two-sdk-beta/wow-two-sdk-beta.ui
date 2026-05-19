import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Image: Story = {
  args: { src: 'https://i.pravatar.cc/120?img=12', name: 'Sam Person' },
};

export const Initials: Story = { args: { name: 'Sam Person' } };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
        <Avatar key={s} name="Sam Person" size={s} />
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Sam Person" shape="circle" />
      <Avatar name="Sam Person" shape="square" />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['neutral', 'primary', 'danger', 'success', 'warning'] as const).map((t) => (
        <Avatar key={t} name="Sam Person" tone={t} />
      ))}
    </div>
  ),
};

export const AutoColor: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {[
        'Alice Brown',
        'Bob Smith',
        'Charlie Davis',
        'Dana Lee',
        'Eve Martin',
        'Frank Owens',
        'Grace Patel',
        'Henry Quinn',
        'Iris Rao',
        'Jack Singh',
        'Kate Tan',
      ].map((n) => (
        <Avatar key={n} name={n} autoColor />
      ))}
    </div>
  ),
};

export const Gradient: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['neutral', 'primary', 'danger', 'success', 'warning'] as const).map((t) => (
        <Avatar key={t} name="Sam Person" tone={t} bgStyle="gradient" />
      ))}
    </div>
  ),
};

export const Ring: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['neutral', 'primary', 'danger', 'success', 'warning'] as const).map((r) => (
        <Avatar key={r} name="Sam Person" ring={r} />
      ))}
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
        <Avatar key={s} name="Sam Person" size={s} isLoading />
      ))}
    </div>
  ),
};

export const Combined: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Alice Brown" autoColor ring="primary" size="lg" />
      <Avatar name="Bob Smith" tone="danger" bgStyle="gradient" ring="danger" size="lg" />
      <Avatar name="Charlie Davis" tone="success" shape="square" ring="success" size="lg" />
      <Avatar src="https://i.pravatar.cc/120?img=15" name="Dana Lee" ring="primary" size="lg" />
    </div>
  ),
};

/* Size union — same prop accepts preset, raw px, CSS string, or dim object. */
export const SizeUnionForms: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">preset (xl)</span>
        <Avatar name="Sam Person" size="xl" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">raw px (56)</span>
        <Avatar name="Sam Person" size={56} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">CSS unit (3.5rem)</span>
        <Avatar name="Sam Person" size="3.5rem" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">explicit dims</span>
        <Avatar name="Sam Person" size={{ width: 80, height: 48 }} shape="square" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">aspect-ratio</span>
        <Avatar name="Sam Person" size={{ width: 80, aspectRatio: '16/9' }} shape="square" />
      </div>
    </div>
  ),
};
