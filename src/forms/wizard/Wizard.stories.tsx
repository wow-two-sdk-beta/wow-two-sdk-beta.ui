import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Wizard, WizardFooter, WizardStep, WizardSteps } from './Wizard';

const meta: Meta = {
  title: 'Forms/Wizard',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [name, setName] = useState('');
      const [email, setEmail] = useState('');
      const [done, setDone] = useState(false);
      return (
        <div className="w-[36rem] rounded-md border border-border bg-card p-4">
          <Wizard
            onComplete={async () => {
              await new Promise((r) => setTimeout(r, 600));
              setDone(true);
            }}
          >
            <WizardSteps />
            <WizardStep
              id="account"
              label="Account"
              validate={() => name.length >= 2 || (alert('Name required'), false)}
            >
              <label className="block text-sm">
                Name
                <input
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </WizardStep>
            <WizardStep id="profile" label="Profile">
              <label className="block text-sm">
                Email
                <input
                  type="email"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </WizardStep>
            <WizardStep id="review" label="Review" final>
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>Name: <strong>{name}</strong></p>
                <p>Email: <strong>{email}</strong></p>
              </div>
              {done && (
                <p className="text-sm text-success">Completed.</p>
              )}
            </WizardStep>
            <WizardFooter />
          </Wizard>
        </div>
      );
    }
    return <Demo />;
  },
};
