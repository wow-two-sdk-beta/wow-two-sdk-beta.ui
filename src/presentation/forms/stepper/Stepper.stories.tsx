import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Stepper } from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Forms/Stepper',
  component: Stepper,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Stepper>;

function Demo() {
  const [step, setStep] = useState('account');
  return (
    <div className="flex flex-col gap-4 w-[640px]">
      <Stepper value={step} onValueChange={setStep}>
        <Stepper.List>
          <Stepper.Step value="account" description="Email & password">
            Account
          </Stepper.Step>
          <Stepper.Step value="profile" description="Personal info">
            Profile
          </Stepper.Step>
          <Stepper.Step value="payment" description="Billing details">
            Payment
          </Stepper.Step>
        </Stepper.List>
        <Stepper.Panel value="account" className="rounded-md border border-border p-4">
          Account form goes here.
        </Stepper.Panel>
        <Stepper.Panel value="profile" className="rounded-md border border-border p-4">
          Profile form goes here.
        </Stepper.Panel>
        <Stepper.Panel value="payment" className="rounded-md border border-border p-4">
          Payment form goes here.
        </Stepper.Panel>
      </Stepper>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => (s === 'profile' ? 'account' : s === 'payment' ? 'profile' : s))}
          className="rounded-md border border-border px-3 py-1.5 text-sm"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => (s === 'account' ? 'profile' : s === 'profile' ? 'payment' : s))}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };
