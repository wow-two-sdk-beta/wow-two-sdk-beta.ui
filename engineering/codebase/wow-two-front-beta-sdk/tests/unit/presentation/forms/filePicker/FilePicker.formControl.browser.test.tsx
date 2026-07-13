import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { FilePicker } from '@src/presentation/forms/filePicker/FilePicker';

/*
 * F-2b regression — file family: the HIDDEN native input carries the context
 * id (Field labels/describedby reference it; label click opens the picker),
 * flags cascade to it, and the trigger button mirrors the description.
 */

afterEach(cleanup);

describe('FilePicker × FormControlContext', () => {
  it('adopts the Field id chain — label reaches the hidden input, trigger mirrors describedby', () => {
    render(
      <Field label="Avatar" helper="Square image works best" isRequired>
        <FilePicker />
      </Field>,
    );

    const input = screen.getByLabelText(/^Avatar/); // Label.htmlFor ↔ hidden native input
    expect(input).toHaveAttribute('type', 'file');
    const helper = screen.getByText('Square image works best');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).not.toHaveAttribute('aria-invalid');

    const trigger = screen.getByRole('button', { name: 'Choose file' });
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
  });

  it('cascades invalid + disabled — describedby swaps to the error node', () => {
    render(
      <Field label="Avatar" error="Unsupported format" isDisabled>
        <FilePicker />
      </Field>,
    );

    const input = screen.getByLabelText('Avatar');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeDisabled();
  });
});
