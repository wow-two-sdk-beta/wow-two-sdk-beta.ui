import type { Meta, StoryObj } from '@storybook/react';
import { AudioPlayer } from './AudioPlayer';

const meta: Meta<typeof AudioPlayer> = {
  title: 'Display/AudioPlayer',
  component: AudioPlayer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AudioPlayer>;

// Use a sample MP3 from the W3C test set.
const SAMPLE_MP3 = 'https://www.w3.org/2010/05/sound/sound_90.mp3';

const PEAKS = Array.from({ length: 200 }, (_, i) => {
  const phase = i / 200;
  const env = phase < 0.1 ? phase / 0.1 : phase > 0.9 ? (1 - phase) / 0.1 : 1;
  return env * (0.4 + Math.random() * 0.6);
});

export const Default: Story = {
  render: () => (
    <div className="w-[42rem]">
      <AudioPlayer src={SAMPLE_MP3} />
    </div>
  ),
};

export const WithWaveform: Story = {
  render: () => (
    <div className="w-[42rem]">
      <AudioPlayer src={SAMPLE_MP3} peaks={PEAKS} />
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="w-[28rem]">
      <AudioPlayer src={SAMPLE_MP3} peaks={PEAKS} compact />
    </div>
  ),
};
