import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { CurrencyInput } from './CurrencyInput';

/*
 * F-2b regression — pins the TRANSITIVE wiring: CurrencyInput wraps the
 * ctx-wired NumberInput, so the Field id chain / describedby / invalid must
 * land on the inner number input with no glue in between.
 */

afterEach(cleanup);

describe('CurrencyInput × FormControlContext (transitive via NumberInput)', () => {
  it('adopts the Field id chain — label reaches the inner input, describedby references the helper', () => {
    render(
      <Field label="Price" helper="USD, before tax" isRequired>
        <CurrencyInput />
      </Field>,
    );

    const input = screen.getByLabelText(/^Price/); // Label.htmlFor ↔ inner input id
    const helper = screen.getByText('USD, before tax');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).toBeRequired(); // native required — NumberInput is the value carrier
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid + disabled — describedby swaps to the error node', () => {
    render(
      <Field label="Price" helper="USD, before tax" error="Enter an amount" isDisabled>
        <CurrencyInput />
      </Field>,
    );

    const input = screen.getByLabelText('Price');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input).toBeDisabled();
  });
});
