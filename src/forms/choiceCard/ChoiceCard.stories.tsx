import type { Meta, StoryObj } from '@storybook/react';
import { Rocket, Sparkles } from 'lucide-react';
import { Icon } from '../../icons';
import { ChoiceCard } from './ChoiceCard';

const meta: Meta<typeof ChoiceCard> = {
  title: 'Forms/ChoiceCard',
  component: ChoiceCard,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ChoiceCard>;

export const Default: Story = {
  render: () => (
    <div className="grid w-[40rem] grid-cols-2 gap-3">
      <ChoiceCard
        name="plan"
        value="pro"
        defaultChecked
        icon={<Icon icon={Rocket} size={20} />}
        label="Pro"
        description="Unlimited projects + priority support."
      />
      <ChoiceCard
        name="plan"
        value="team"
        icon={<Icon icon={Sparkles} size={20} />}
        label="Team"
        description="Multiple seats + audit log."
      />
    </div>
  ),
};
