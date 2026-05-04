import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AddressForm, type Address } from './AddressForm';

const meta: Meta<typeof AddressForm> = {
  title: 'Forms/AddressForm',
  component: AddressForm,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AddressForm>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [addr, setAddr] = useState<Address>({
        country: 'US',
        line1: '1600 Amphitheatre Pkwy',
        city: 'Mountain View',
        region: 'CA',
        postalCode: '94043',
      });
      return (
        <div className="w-[36rem] space-y-3">
          <AddressForm value={addr} onValueChange={setAddr} />
          <pre className="rounded-md bg-muted p-2 text-xs">{JSON.stringify(addr, null, 2)}</pre>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Compact: Story = {
  render: () => (
    <div className="w-80">
      <AddressForm compact />
    </div>
  ),
};
