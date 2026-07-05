import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { IconPicker } from './IconPicker';

const meta: Meta<typeof IconPicker> = {
  title: 'Forms/IconPicker',
  component: IconPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof IconPicker>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [icon, setIcon] = useState<string>('star');
      return (
        <div className="w-[26rem] space-y-3">
          <IconPicker value={icon} onValueChange={setIcon} />
          <p className="text-xs text-muted-foreground">selected: <code>{icon || '(none)'}</code></p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const WithName: Story = {
  render: () => (
    <div className="w-[26rem]">
      <IconPicker defaultValue="heart" name="favorite-icon" />
    </div>
  ),
};
