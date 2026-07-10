import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { FormControlProvider } from '../../../foundation/primitives';
import { FormErrorMessage } from './FormErrorMessage';

const meta: Meta<typeof FormErrorMessage> = {
  title: 'Forms/FormErrorMessage',
  component: FormErrorMessage,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FormErrorMessage>;

export const Default: Story = { args: { children: 'Email is required.' } };

export const MultipleErrors: Story = {
  /* Without children the node renders the context's `errors` — ALL of them (client +
     server merged), the shape the forms-engine `form.Field` glue feeds in. */
  render: () => (
    <FormControlProvider isInvalid errors={['Must be at least 6 characters.', 'Digits are not allowed.']}>
      <FormErrorMessage />
    </FormControlProvider>
  ),
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert).toHaveTextContent('Must be at least 6 characters.');
    await expect(alert).toHaveTextContent('Digits are not allowed.');
  },
};

export const NothingToShow: Story = {
  /* Invalid but message-less → renders nothing: no empty alert box, and the control's
     `aria-describedby` never references a non-existent error node. */
  render: () => (
    <FormControlProvider isInvalid>
      <FormErrorMessage />
    </FormControlProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('alert')).not.toBeInTheDocument();
  },
};
