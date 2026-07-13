import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { StandardSchemaV1 } from '@src/forms-engine';
import { useAppForm } from '@src/forms-engine/house';
import { TextInput } from '@src/presentation/forms/textInput/TextInput';
import { Field } from '@src/presentation/forms/field/Field';

const meta: Meta<typeof Field> = {
  title: 'Forms/Field',
  component: Field,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Field>;

export const WithHelper: Story = {
  args: { label: 'Email', helper: "We'll never share it." },
  render: (args) => (
    <div className="w-72">
      <Field {...args}><TextInput placeholder="you@example.com" /></Field>
    </div>
  ),
};

export const WithError: Story = {
  args: { label: 'Email', error: 'Email is required.', isRequired: true },
  render: (args) => (
    <div className="w-72">
      <Field {...args}><TextInput defaultValue="" /></Field>
    </div>
  ),
};

/* ────────── Interaction test (play — runs as a browser test via the vitest addon) ────────── */

interface SignupValues {
  email: string;
}

/** Two independent issues on the same field — pins the multi-error render path. */
const SIGNUP_SCHEMA: StandardSchemaV1<SignupValues> = {
  '~standard': {
    version: 1,
    vendor: 'story',
    validate: (value) => {
      const values = value as SignupValues;
      const issues: StandardSchemaV1.Issue[] = [];
      if (!values.email.includes('@')) issues.push({ message: 'Enter a valid email.', path: ['email'] });
      if (values.email.length < 6) issues.push({ message: 'At least 6 characters.', path: ['email'] });
      return issues.length > 0 ? { issues } : { value: values };
    },
  },
};

function EngineWiredDemo() {
  /* The F-2a composition: ONE chrome element per field, zero hand-wiring — the `Field`
     adopts `form.Field`'s provider, so errors/aria/label ids flow automatically. */
  const form = useAppForm<SignupValues>({
    defaultValues: { email: '' },
    schema: SIGNUP_SCHEMA,
    onSubmit: async () => null,
  });
  return (
    <form className="flex w-72 flex-col gap-3" onSubmit={(event) => void form.handleSubmit(event)}>
      <form.Field name="email">
        {(field) => (
          <Field label="Email" helper="Work address preferred.">
            <TextInput
              value={field.value}
              onChange={(event) => field.setValue(event.target.value)}
              onBlur={field.onBlur}
            />
          </Field>
        )}
      </form.Field>
      <button type="submit" className="self-start rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Save
      </button>
    </form>
  );
}

export const WiredToFormEngine: StoryObj<typeof EngineWiredDemo> = {
  render: () => <EngineWiredDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText<HTMLInputElement>('Email');
    const helper = canvas.getByText('Work address preferred.');
    await expect(input.getAttribute('aria-describedby')).toBe(helper.id);

    // Invalid submit → BOTH schema messages render in one alert; helper steps aside.
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveTextContent('Enter a valid email.');
    await expect(alert).toHaveTextContent('At least 6 characters.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    await expect(canvas.queryByText('Work address preferred.')).not.toBeInTheDocument();

    // Fixing the field clears errors post-attempt; helper and its reference return.
    await userEvent.type(input, 'ada@example.io');
    await waitFor(() => expect(canvas.queryByRole('alert')).not.toBeInTheDocument());
    await expect(input.getAttribute('aria-describedby')).toBe(
      canvas.getByText('Work address preferred.').id,
    );
  },
};
