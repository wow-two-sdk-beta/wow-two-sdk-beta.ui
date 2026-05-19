import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'glass', 'glass-surface'] as const;
const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

function DefaultStory() {
  const [checked, setChecked] = useState(false);
  return (
    <label className="inline-flex items-center gap-2">
      <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      <span>Default solid + primary</span>
    </label>
  );
}

export const Default: Story = { render: () => <DefaultStory /> };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {SIZES.map((s) => (
        <label key={s} className="inline-flex items-center gap-2">
          <Checkbox size={s} defaultChecked />
          <span>{s}</span>
        </label>
      ))}
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {VARIANTS.map((v) => (
        <label key={v} className="inline-flex items-center gap-2">
          <Checkbox variant={v} indeterminate />
          <span>{v}</span>
        </label>
      ))}
    </div>
  ),
};

/* Full matrix: 6 variants × 5 tones. Each cell shows unchecked, checked, indeterminate. */
export const Matrix: Story = {
  render: () => (
    <div className="space-y-6">
      {VARIANTS.map((v) => (
        <div key={v}>
          <div className="text-sm font-semibold mb-2 capitalize">{v}</div>
          <div className="grid grid-cols-5 gap-4">
            {TONES.map((t) => (
              <div key={t} className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <Checkbox variant={v} tone={t} />
                  <Checkbox variant={v} tone={t} defaultChecked />
                  <Checkbox variant={v} tone={t} indeterminate />
                </div>
                <div className="text-xs text-muted-foreground">{t}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

/* Glass-on-photo recipe — mirrors haven's listing-card overlay use case. */
export const GlassOnPhoto: Story = {
  render: () => (
    <div
      className="relative h-48 w-96 rounded-lg overflow-hidden p-3"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600)',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <Checkbox variant="glass" />
        <Checkbox variant="glass" defaultChecked />
        <Checkbox variant="glass-surface" />
        <Checkbox variant="glass-surface" defaultChecked />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox disabled />
      <Checkbox disabled defaultChecked />
      <Checkbox disabled indeterminate />
    </div>
  ),
};

/* Size union — same prop accepts preset, raw px, CSS string, or dim object. */
export const SizeUnionForms: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">preset (lg)</span>
        <Checkbox size="lg" defaultChecked />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">raw px (32)</span>
        <Checkbox size={32} defaultChecked />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">CSS unit (1.5rem)</span>
        <Checkbox size="1.5rem" defaultChecked />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-32">explicit dims</span>
        <Checkbox size={{ width: 24, height: 24 }} defaultChecked />
      </div>
    </div>
  ),
};
