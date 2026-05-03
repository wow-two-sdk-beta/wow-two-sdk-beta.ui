import type { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from '../toggleButton/ToggleButton';
import { ToggleButtonGroup } from './ToggleButtonGroup';

const meta: Meta<typeof ToggleButtonGroup> = {
  title: 'Actions/ToggleButtonGroup',
  component: ToggleButtonGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ToggleButtonGroup>;

export const Single: Story = {
  render: () => (
    <ToggleButtonGroup type="single" defaultValue="day">
      <ToggleButton value="day">Day</ToggleButton>
      <ToggleButton value="week">Week</ToggleButton>
      <ToggleButton value="month">Month</ToggleButton>
    </ToggleButtonGroup>
  ),
};

export const Multi: Story = {
  render: () => (
    <ToggleButtonGroup type="multi" defaultValue={['bold', 'italic']}>
      <ToggleButton value="bold">B</ToggleButton>
      <ToggleButton value="italic">I</ToggleButton>
      <ToggleButton value="underline">U</ToggleButton>
    </ToggleButtonGroup>
  ),
};
