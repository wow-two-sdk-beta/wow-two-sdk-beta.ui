import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AudioWaveform } from './AudioWaveform';

const meta: Meta<typeof AudioWaveform> = {
  title: 'Display/AudioWaveform',
  component: AudioWaveform,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AudioWaveform>;

// Synthetic peaks resembling a song: rising → sustained → decaying.
const PEAKS = Array.from({ length: 200 }, (_, i) => {
  const phase = i / 200;
  const env = phase < 0.1 ? phase / 0.1 : phase > 0.9 ? (1 - phase) / 0.1 : 1;
  return env * (0.4 + Math.random() * 0.6);
});

export const Default: Story = {
  render: () => {
    function Demo() {
      const [progress, setProgress] = useState(0.35);
      return (
        <div className="space-y-2">
          <AudioWaveform peaks={PEAKS} progress={progress} onSeek={setProgress} width={360} />
          <p className="text-xs text-muted-foreground">progress: {(progress * 100).toFixed(0)}%</p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Tones: Story = {
  render: () => (
    <div className="space-y-2">
      <AudioWaveform peaks={PEAKS} progress={0.5} tone="brand" width={360} />
      <AudioWaveform peaks={PEAKS} progress={0.5} tone="success" width={360} />
      <AudioWaveform peaks={PEAKS} progress={0.5} tone="danger" width={360} />
      <AudioWaveform peaks={PEAKS} progress={0.5} tone="muted" width={360} />
    </div>
  ),
};

export const Static: Story = {
  render: () => <AudioWaveform peaks={PEAKS} progress={0} width={360} />,
};
