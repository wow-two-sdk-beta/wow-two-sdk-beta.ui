import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { KeyboardShortcutPicker } from './KeyboardShortcutPicker';

const meta: Meta<typeof KeyboardShortcutPicker> = {
  title: 'Forms/KeyboardShortcutPicker',
  component: KeyboardShortcutPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof KeyboardShortcutPicker>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [keys, setKeys] = useState<string[]>(['Meta', 'K']);
      return (
        <div className="space-y-3">
          <KeyboardShortcutPicker value={keys} onValueChange={setKeys} />
          <p className="text-xs text-muted-foreground">
            captured: <code>{keys.join('+') || '(empty)'}</code>
          </p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Empty: Story = {
  render: () => <KeyboardShortcutPicker />,
};

export const Disabled: Story = {
  render: () => <KeyboardShortcutPicker defaultValue={['Meta', 'Shift', 'P']} disabled />,
};
