import type { Meta, StoryObj } from '@storybook/react';
import { Surface } from './Surface';
import type {
  SurfaceVariant,
  SurfaceTone,
  SurfaceElevation,
  SurfaceRadius,
  SurfacePadding,
} from '../../utils';

const meta: Meta<typeof Surface> = {
  title: 'Layout/Surface',
  component: Surface,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'solid',
        'soft',
        'surface',
        'outline',
        'glass',
        'glass-outline',
        'elevated',
        'flat',
      ],
    },
    tone: {
      control: 'select',
      options: ['neutral', 'primary', 'danger', 'success', 'warning', 'info'],
    },
    radius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
    },
    padding: {
      control: 'select',
      options: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    elevation: {
      control: 'select',
      options: [undefined, 0, 1, 2, 3, 4, 5],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Surface>;

export const Playground: Story = {
  args: {
    variant: 'surface',
    tone: 'neutral',
    radius: 'md',
    padding: 'lg',
  },
  render: (args) => (
    <Surface {...args}>
      <div className="text-sm">Surface content — adjust the controls.</div>
    </Surface>
  ),
};

const variants: SurfaceVariant[] = [
  'solid',
  'soft',
  'surface',
  'outline',
  'glass',
  'glass-outline',
  'elevated',
  'flat',
];
const tones: SurfaceTone[] = ['neutral', 'primary', 'danger', 'success', 'warning', 'info'];

export const VariantToneMatrix: Story = {
  render: () => (
    <div
      className="min-h-screen p-8"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #6366f1 0%, #a855f7 35%, #ec4899 70%, #f97316 100%)',
      }}
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: `120px repeat(${tones.length}, 1fr)` }}>
        <div />
        {tones.map((t) => (
          <div key={t} className="text-center text-xs font-semibold uppercase tracking-wide text-white/90">
            {t}
          </div>
        ))}
        {variants.map((v) => (
          <>
            <div key={`label-${v}`} className="self-center text-xs font-semibold uppercase tracking-wide text-white/90">
              {v}
            </div>
            {tones.map((t) => (
              <Surface key={`${v}-${t}`} variant={v} tone={t} padding="md" radius="md">
                <div className="text-xs font-medium">{v}</div>
                <div className="text-[10px] opacity-70">{t}</div>
              </Surface>
            ))}
          </>
        ))}
      </div>
    </div>
  ),
};

const radii: SurfaceRadius[] = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'];

export const RadiusScale: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4 p-6">
      {radii.map((r) => (
        <Surface key={r} radius={r} padding="md" className="w-24">
          <div className="text-center text-xs">{r}</div>
        </Surface>
      ))}
    </div>
  ),
};

const paddings: SurfacePadding[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];

export const PaddingScale: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4 p-6">
      {paddings.map((p) => (
        <Surface key={p} padding={p} className="w-32">
          <div className="text-center text-xs">{p}</div>
        </Surface>
      ))}
    </div>
  ),
};

const elevations: SurfaceElevation[] = [0, 1, 2, 3, 4, 5];

export const ElevationScale: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6 bg-muted/40 p-10">
      {elevations.map((e) => (
        <Surface key={e} variant="flat" elevation={e} padding="lg" className="w-28">
          <div className="text-center text-xs">elevation {e}</div>
        </Surface>
      ))}
    </div>
  ),
};
