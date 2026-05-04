import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../button/Button';
import { ButtonGroup } from './ButtonGroup';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Actions/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Attached: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="soft" tone="neutral">Day</Button>
      <Button variant="soft" tone="neutral">Week</Button>
      <Button variant="soft" tone="neutral">Month</Button>
    </ButtonGroup>
  ),
};

export const Spaced: Story = {
  render: () => (
    <ButtonGroup attached={false}>
      <Button>Save</Button>
      <Button variant="ghost">Cancel</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="soft" tone="neutral">Top</Button>
      <Button variant="soft" tone="neutral">Middle</Button>
      <Button variant="soft" tone="neutral">Bottom</Button>
    </ButtonGroup>
  ),
};
