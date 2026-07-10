import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { PercentInput } from './PercentInput';

/*
 * F-2b regression — pins the TRANSITIVE wiring: PercentInput wraps the
 * ctx-wired NumberInput, so the Field id chain / describedby / invalid must
 * land on the inner number input with no glue in between.
 */

afterEach(cleanup);

describe('PercentInput × FormControlContext (transitive via NumberInput)', () => {
  it('adopts the Field id chain — label reaches the inner input, describedby references the helper', () => {
    render(
      <Field label="Discount" helper="0 to 100" isRequired>
        <PercentInput />
      </Field>,
    );

    const input = screen.getByLabelText(/^Discount/); // Label.htmlFor ↔ inner input id
    const helper = screen.getByText('0 to 100');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).toBeRequired(); // native required — NumberInput is the value carrier
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid + disabled — describedby swaps to the error node', () => {
    render(
      <Field label="Discount" helper="0 to 100" error="Out of range" isDisabled>
        <PercentInput />
      </Field>,
    );

    const input = screen.getByLabelText('Discount');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input).toBeDisabled();
  });
});
