import type { Meta, StoryObj } from '@storybook/react';
import { VideoPlayer } from './VideoPlayer';

const meta: Meta<typeof VideoPlayer> = {
  title: 'Display/VideoPlayer',
  component: VideoPlayer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof VideoPlayer>;

const SAMPLE_MP4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export const Default: Story = {
  render: () => (
    <div className="w-[42rem]">
      <VideoPlayer src={SAMPLE_MP4} />
    </div>
  ),
};

export const WithPoster: Story = {
  render: () => (
    <div className="w-[42rem]">
      <VideoPlayer
        src={SAMPLE_MP4}
        poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
      />
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-96">
      <VideoPlayer src={SAMPLE_MP4} aspectRatio="1/1" />
    </div>
  ),
};
