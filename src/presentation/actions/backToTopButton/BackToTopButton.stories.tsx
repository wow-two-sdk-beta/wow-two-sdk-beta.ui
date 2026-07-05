import type { Meta, StoryObj } from '@storybook/react';
import { BackToTopButton } from './BackToTopButton';

const meta: Meta<typeof BackToTopButton> = {
  title: 'Actions/BackToTopButton',
  component: BackToTopButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof BackToTopButton>;

export const Default: Story = {
  render: () => (
    <div>
      <div className="space-y-3 text-sm text-muted-foreground">
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i}>Paragraph {i + 1}. Scroll down to see the button appear.</p>
        ))}
      </div>
      <BackToTopButton threshold={300} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div>
      <div className="space-y-3 text-sm text-muted-foreground">
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i}>Paragraph {i + 1}.</p>
        ))}
      </div>
      <BackToTopButton threshold={300} label="Top" />
    </div>
  ),
};
