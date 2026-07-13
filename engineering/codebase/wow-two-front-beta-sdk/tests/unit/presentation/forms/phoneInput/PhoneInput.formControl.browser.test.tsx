import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { PhoneInput } from '@src/presentation/forms/phoneInput/PhoneInput';

/*
 * F-2b regression — text-composites family: the national-number input is the
 * composite's primary control (context id + describedby land there), flags
 * cascade to both focusables, and the select keeps its built-in name.
 */

afterEach(cleanup);

describe('PhoneInput × FormControlContext', () => {
  it('adopts the Field id chain — label reaches the national input, describedby references the helper', () => {
    render(
      <Field label="Phone" helper="Include area code" isRequired>
        <PhoneInput />
      </Field>,
    );

    const input = screen.getByLabelText(/^Phone/); // Label.htmlFor ↔ national input id
    const helper = screen.getByText('Include area code');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Country')).toBeInTheDocument(); // built-in select name intact
  });

  it('cascades invalid + disabled onto both focusables — describedby swaps to the error node', () => {
    render(
      <Field label="Phone" error="Invalid number" isDisabled>
        <PhoneInput />
      </Field>,
    );

    const input = screen.getByLabelText('Phone');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input).toBeDisabled();
    expect(screen.getByLabelText('Country')).toBeDisabled();
  });
});
