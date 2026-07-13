import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { Field } from '@src/presentation/forms/field/Field';
import { CheckboxField } from '@src/presentation/forms/checkboxField/CheckboxField';

const meta: Meta<typeof CheckboxField> = {
  title: 'Forms/CheckboxField',
  component: CheckboxField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CheckboxField>;

export const Default: Story = {
  args: { label: 'Send weekly digest', description: 'Summary of activity every Monday morning.' },
};

export const InsideField: Story = {
  /* Id precedence regression: inside a `Field` the box takes the CONTEXT id
     (`id ?? ctx.id ?? generated`), so the Field-rendered label actually targets it. */
  render: () => (
    <Field label="Notifications" helper="You can change this anytime.">
      <CheckboxField label="Send weekly digest" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox');
    const fieldLabel = canvas.getByText('Notifications');
    await expect(fieldLabel).toHaveAttribute('for', box.id);
    // Clicking the Field label toggles the box — proof the wiring is real, not cosmetic.
    await userEvent.click(fieldLabel);
    await expect(box).toBeChecked();
  },
};
