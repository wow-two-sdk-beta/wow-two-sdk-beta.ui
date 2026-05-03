import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Display/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Slotted: Story = {
  render: () => (
    <Card className="w-80">
      <Card.Header>
        <Card.Title>Project Aurora</Card.Title>
        <Card.Description>Q3 milestone tracking</Card.Description>
      </Card.Header>
      <Card.Body>
        <p>3 of 8 milestones complete. Next: schema lock by Friday.</p>
      </Card.Body>
      <Card.Footer>
        <span className="text-xs text-muted-foreground">Updated 2 hours ago</span>
      </Card.Footer>
    </Card>
  ),
};

export const Padded: Story = {
  render: () => (
    <Card padding="md" className="w-80">
      Free-form content with default padding.
    </Card>
  ),
};
