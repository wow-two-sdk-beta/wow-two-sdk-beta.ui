import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PhoneInput } from './PhoneInput';

const meta: Meta<typeof PhoneInput> = {
  title: 'Forms/PhoneInput',
  component: PhoneInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PhoneInput>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [phone, setPhone] = useState('+15555551234');
      return (
        <div className="space-y-3">
          <PhoneInput value={phone} onValueChange={setPhone} />
          <p className="text-xs text-muted-foreground">E.164: <code>{phone}</code></p>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Empty: Story = {
  render: () => <PhoneInput defaultCountry="GB" />,
};

export const Invalid: Story = {
  render: () => <PhoneInput defaultValue="+19" invalid />,
};
