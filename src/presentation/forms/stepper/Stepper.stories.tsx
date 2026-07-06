import type { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
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

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/** Fixed 3-step wizard — `onValueChange` arrives via args (spy); uncontrolled active step. */
function interactionStepper(
  args: { onValueChange?: (value: string) => void },
  opts: { disablePayment?: boolean } = {},
) {
  return (
    <div className="w-[640px]">
      <Stepper defaultValue="account" onValueChange={args.onValueChange}>
        <Stepper.List>
          <Stepper.Step value="account">Account</Stepper.Step>
          <Stepper.Step value="profile">Profile</Stepper.Step>
          <Stepper.Step value="payment" isDisabled={opts.disablePayment}>
            Payment
          </Stepper.Step>
        </Stepper.List>
        <Stepper.Panel value="account">Account panel</Stepper.Panel>
        <Stepper.Panel value="profile">Profile panel</Stepper.Panel>
        <Stepper.Panel value="payment">Payment panel</Stepper.Panel>
      </Stepper>
    </div>
  );
}

export const ClickingStepActivatesItAndSwapsPanel: Story = {
  args: { onValueChange: fn() },
  render: (args) => interactionStepper(args),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await expect(tabs).toHaveLength(3);
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Account panel');

    await userEvent.click(canvas.getByRole('tab', { name: 'Profile' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(args.onValueChange).toHaveBeenCalledWith('profile');
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[1]).toHaveAttribute('aria-current', 'step');
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    /* Only the active step's panel is in the tree. */
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Profile panel');
    await expect(canvas.queryByText('Account panel')).not.toBeInTheDocument();
  },
};

export const StepStatusesTrackTheActiveIndex: Story = {
  render: (args) => interactionStepper(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    /* Jump to the last step — everything before it flips to complete. */
    await userEvent.click(canvas.getByRole('tab', { name: 'Payment' }));
    await expect(tabs[0]).toHaveAttribute('data-status', 'complete');
    await expect(tabs[1]).toHaveAttribute('data-status', 'complete');
    await expect(tabs[2]).toHaveAttribute('data-status', 'active');

    /* Jump back to the first — the later steps return to pending. */
    await userEvent.click(canvas.getByRole('tab', { name: 'Account' }));
    await expect(tabs[0]).toHaveAttribute('data-status', 'active');
    await expect(tabs[1]).toHaveAttribute('data-status', 'pending');
    await expect(tabs[2]).toHaveAttribute('data-status', 'pending');
  },
};

export const ArrowKeysRoveFocusWithoutActivating: Story = {
  render: (args) => interactionStepper(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await userEvent.click(tabs[0]!);
    await expect(tabs[0]).toHaveFocus();

    /* Roving focus moves with the arrows but does NOT select. */
    await userEvent.keyboard('{ArrowRight}');
    await expect(tabs[1]).toHaveFocus();
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    await userEvent.keyboard('{End}');
    await expect(tabs[2]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(tabs[0]).toHaveFocus();
    /* The group loops past its edges. */
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tabs[2]).toHaveFocus();
  },
};

export const DisabledStepCannotBeActivated: Story = {
  args: { onValueChange: fn() },
  render: (args) => interactionStepper(args, { disablePayment: true }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const payment = canvas.getByRole('tab', { name: 'Payment' });
    await expect(payment).toBeDisabled();
    await expect(payment).toHaveAttribute('data-status', 'pending');

    /* The step is pointer-inert (disabled + pointer-events-none) — a forced click still
       cannot activate it, whichever layer swallows it. */
    await fireEvent.click(payment);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Account panel');
    await expect(payment).toHaveAttribute('aria-selected', 'false');
  },
};
