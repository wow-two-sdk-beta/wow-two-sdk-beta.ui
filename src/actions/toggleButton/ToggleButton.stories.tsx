import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Eye, EyeOff, Trash2, Pin, PinOff, Star } from 'lucide-react';
import { Icon } from '../../icons';
import { ToggleButton } from './ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Actions/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ToggleButton>;

const VARIANTS = ['ghost', 'soft', 'outline', 'solid', 'glass', 'glass-surface'] as const;
const TONES = ['primary', 'neutral', 'danger', 'success', 'warning'] as const;

export const Default: Story = { args: { children: 'Toggle' } };
export const DefaultPressed: Story = { args: { defaultPressed: true, children: 'Pressed' } };

export const WithIcon: Story = {
  args: { 'aria-label': 'Bold', shape: 'square', children: <Icon icon={Bold} size={16} /> },
};

/* Icon-swap via render-prop — uncontrolled toggle changes its own icon based on pressed state. */
export const IconSwap: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ToggleButton aria-label="Toggle visibility" shape="square" tone="neutral">
        {({ pressed }) => <Icon icon={pressed ? Eye : EyeOff} size={16} />}
      </ToggleButton>
      <ToggleButton aria-label="Toggle pin" shape="square" tone="primary">
        {({ pressed }) => <Icon icon={pressed ? Pin : PinOff} size={16} />}
      </ToggleButton>
    </div>
  ),
};

/* Full matrix: 6 variants × 5 tones, unpressed + pressed side by side. */
export const Matrix: Story = {
  render: () => (
    <div className="space-y-6">
      {VARIANTS.map((v) => (
        <div key={v}>
          <div className="text-sm font-semibold mb-2 capitalize">{v}</div>
          <div className="grid grid-cols-5 gap-4">
            {TONES.map((t) => (
              <div key={t} className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <ToggleButton variant={v} tone={t} shape="square" aria-label={`${v} ${t} off`}>
                    <Icon icon={Star} size={16} />
                  </ToggleButton>
                  <ToggleButton variant={v} tone={t} shape="square" defaultPressed aria-label={`${v} ${t} on`}>
                    <Icon icon={Star} size={16} />
                  </ToggleButton>
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

/* Glass-on-photo recipe — image-overlay toggle (haven listing card pattern). */
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
        <ToggleButton variant="glass" shape="square" size={20} aria-label="Show deleted (off)">
          <Icon icon={Trash2} size={12} />
        </ToggleButton>
        <ToggleButton variant="glass" shape="square" size={20} tone="danger" defaultPressed aria-label="Show deleted (on)">
          <Icon icon={Trash2} size={12} />
        </ToggleButton>
        <ToggleButton variant="glass-surface" shape="square" size={20} aria-label="Star (off)">
          <Icon icon={Star} size={12} />
        </ToggleButton>
        <ToggleButton variant="glass-surface" shape="square" size={20} tone="warning" defaultPressed aria-label="Star (on)">
          <Icon icon={Star} size={12} />
        </ToggleButton>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <ToggleButton key={s} size={s} variant="soft" defaultPressed>
          {s}
        </ToggleButton>
      ))}
    </div>
  ),
};
