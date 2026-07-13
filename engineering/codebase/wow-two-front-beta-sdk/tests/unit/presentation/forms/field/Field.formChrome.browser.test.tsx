import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ApiError } from '@src/foundation/http';
import type { AppFieldApi, AppForm, FormEngine } from '@src/forms-engine';
import { useAppForm as useHouseAppForm } from '@src/forms-engine/house';
import { useAppForm as useTanstackAppForm } from '@src/forms-engine/tanstack';
import { CheckboxField } from '@src/presentation/forms/checkboxField/CheckboxField';
import { FormErrorMessage } from '@src/presentation/forms/formErrorMessage/FormErrorMessage';
import { RadioField } from '@src/presentation/forms/radioField/RadioField';
import { SwitchField } from '@src/presentation/forms/switchField/SwitchField';
import { TextInput } from '@src/presentation/forms/textInput/TextInput';

import { Field } from '@src/presentation/forms/field/Field';

/*
 * F-2a integration proof — the presentation `Field` chrome over the forms-engine glue,
 * exercised on BOTH engines. Pins the boundaries-clean composition: `form.Field` mounts
 * the only `FormControlProvider`; the `Field` composed inside ADOPTS it (same ids, no
 * shadowing), errors render with zero hand-wiring (all of them), `aria-describedby`
 * references only chrome that exists in the DOM, and the `*Field` composites take the
 * context id so `Field`-rendered labels reach their control.
 */

afterEach(cleanup);

interface NameValues {
  name: string;
}

/** Renders a `form.Field name="name"` with the given chrome; captures the form + field APIs. */
function renderNameField(
  useAppForm: FormEngine['useAppForm'],
  renderField: (field: AppFieldApi<string>) => React.ReactNode,
  onSubmit: () => Promise<unknown> = async () => null,
) {
  const captured = {
    form: null as unknown as AppForm<NameValues>,
    field: null as unknown as AppFieldApi<string>,
  };
  function Harness() {
    const form = useAppForm<NameValues>({ defaultValues: { name: '' }, onSubmit });
    captured.form = form;
    return (
      <form.Field name="name">
        {(field) => {
          captured.field = field;
          return renderField(field);
        }}
      </form.Field>
    );
  }
  render(<Harness />);
  return captured;
}

const doubleErrorSubmit = async (): Promise<unknown> => {
  throw new ApiError(400, { errors: { Name: ['Too short', 'No digits allowed'] } });
};

function describeFieldFormChrome(engineName: string, useAppForm: FormEngine['useAppForm']): void {
  describe(`Field chrome over the forms engine — ${engineName}`, () => {
    it('adopts the glue provider: one id chain, label wired, helper referenced only while rendered', () => {
      renderNameField(useAppForm, (field) => (
        <Field label="Name" helper="Your public name">
          <TextInput
            value={field.value}
            onChange={(event) => field.setValue(event.target.value)}
            onBlur={field.onBlur}
          />
        </Field>
      ));

      // `getByLabelText` proves Label.htmlFor ↔ control id through the ADOPTED (outer) provider.
      const input = screen.getByLabelText('Name');
      const helper = screen.getByText('Your public name');
      expect(input.getAttribute('aria-describedby')).toBe(helper.id);
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('renders ALL field errors automatically (no error={f.errors[0]} hand-wiring), swaps helper out and back', async () => {
      const captured = renderNameField(
        useAppForm,
        (field) => (
          <Field label="Name" helper="Your public name">
            <TextInput
              value={field.value}
              onChange={(event) => field.setValue(event.target.value)}
              onBlur={field.onBlur}
            />
          </Field>
        ),
        doubleErrorSubmit,
      );

      await act(async () => captured.form.handleSubmit());
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Too short');
      expect(alert).toHaveTextContent('No digits allowed');

      const input = screen.getByLabelText('Name');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      // Helper is hidden while errors show — describedby references the error node only.
      expect(screen.queryByText('Your public name')).toBeNull();
      expect(input.getAttribute('aria-describedby')).toBe(alert.id);

      // Fixing the field clears the server error → helper returns, references follow.
      await act(async () => captured.field.setValue('grace'));
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
      const helper = screen.getByText('Your public name');
      expect(input.getAttribute('aria-describedby')).toBe(helper.id);
      expect(input).not.toHaveAttribute('aria-invalid');
    });

    it('an explicit `error` prop overrides the context errors (single hand-written message)', async () => {
      const captured = renderNameField(
        useAppForm,
        (field) => (
          <Field label="Name" error="Custom message">
            <TextInput value={field.value} onChange={(event) => field.setValue(event.target.value)} />
          </Field>
        ),
        doubleErrorSubmit,
      );

      await act(async () => captured.form.handleSubmit());
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Custom message');
      expect(alert).not.toHaveTextContent('Too short');
    });

    it('a bare control never references non-rendered chrome (dangling aria-describedby fix)', async () => {
      const captured = renderNameField(useAppForm, (field) => (
        <TextInput value={field.value} onChange={(event) => field.setValue(event.target.value)} />
      ));

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
      await act(async () => captured.form.setFieldErrors({ name: ['Server says no'] }));
      // Still nothing rendered to describe the control by — no reference appears.
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });

    it('a hand-placed <FormErrorMessage /> renders the context errors and wires describedby', async () => {
      const captured = renderNameField(
        useAppForm,
        (field) => (
          <>
            <TextInput value={field.value} onChange={(event) => field.setValue(event.target.value)} />
            <FormErrorMessage />
          </>
        ),
        doubleErrorSubmit,
      );

      // Nothing to show yet → the node renders null, nothing referenced.
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');

      await act(async () => captured.form.handleSubmit());
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Too short');
      expect(alert).toHaveTextContent('No digits allowed');
      expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe(alert.id);
    });

    it('CheckboxField / RadioField / SwitchField take the context id — Field labels reach the control', () => {
      const composites = [
        { label: 'Agree', role: 'checkbox', node: <CheckboxField label="I agree" /> },
        { label: 'Pick', role: 'radio', node: <RadioField label="Option A" /> },
        { label: 'Toggle', role: 'switch', node: <SwitchField label="Enabled" /> },
      ] as const;

      for (const composite of composites) {
        function Harness() {
          const form = useAppForm<NameValues>({ defaultValues: { name: '' }, onSubmit: async () => null });
          return (
            <form.Field name="name">{() => <Field label={composite.label}>{composite.node}</Field>}</form.Field>
          );
        }
        const view = render(<Harness />);
        const control = screen.getByRole(composite.role);
        const fieldLabel = screen.getByText(composite.label);
        // The `Field`-rendered Label's htmlFor must hit the composite's input (id ?? ctx.id ?? generated).
        expect(fieldLabel).toHaveAttribute('for', control.id);
        view.unmount();
      }
    });
  });
}

describeFieldFormChrome('house', useHouseAppForm);
describeFieldFormChrome('tanstack', useTanstackAppForm);
