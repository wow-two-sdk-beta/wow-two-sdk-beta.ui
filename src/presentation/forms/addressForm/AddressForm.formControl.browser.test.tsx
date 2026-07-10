import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { AddressForm } from './AddressForm';

/*
 * F-2b grouped-choices regression — group-level FormControlContext wiring.
 * The root (`role="group"`) adopts the context id + labelledBy/describedBy +
 * aria-invalid; disabled/read-only cascade to every sub-field; the sub-fields
 * keep their own self-contained label/id pairs (no context id leakage).
 */

afterEach(cleanup);

function renderAddress(fieldProps: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Shipping address" helper="Where we deliver" {...fieldProps}>
      <AddressForm />
    </Field>,
  );
}

describe('AddressForm — FormControlContext (group wiring)', () => {
  it('the group node takes the context id + label/helper references', () => {
    renderAddress();
    const group = screen.getByRole('group', { name: 'Shipping address' });
    const label = screen.getByText('Shipping address');
    const helper = screen.getByText('Where we deliver');
    // `Label htmlFor` resolves onto the group container (labelledBy composition names it).
    expect(label).toHaveAttribute('for', group.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('sub-fields keep their own label/id pairs — no context id leakage', () => {
    renderAddress();
    const group = screen.getByRole('group', { name: 'Shipping address' });
    const city = screen.getByLabelText('City');
    const line1 = screen.getByLabelText('Address line 1');
    expect(city.id).not.toBe(group.id);
    expect(line1.id).not.toBe(group.id);
    expect(city.id).not.toBe(line1.id);
  });

  it('invalid lands on the group node, describedby follows the error chrome', () => {
    renderAddress({ error: 'Address is incomplete' });
    const group = screen.getByRole('group', { name: 'Shipping address' });
    const alert = screen.getByRole('alert');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('disabled cascades to every sub-field', () => {
    renderAddress({ isDisabled: true });
    expect(screen.getByLabelText('Country')).toBeDisabled();
    expect(screen.getByLabelText('Address line 1')).toBeDisabled();
    expect(screen.getByLabelText('City')).toBeDisabled();
    expect(screen.getByLabelText('State')).toBeDisabled();
    expect(screen.getByLabelText('ZIP code')).toBeDisabled();
  });

  it('read-only cascades to the text sub-fields and locks the selects', () => {
    renderAddress({ isReadOnly: true });
    expect(screen.getByLabelText('Address line 1')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('City')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('ZIP code')).toHaveAttribute('readonly');
    // Selects have no native read-only — they lock via disabled.
    expect(screen.getByLabelText('Country')).toBeDisabled();
    expect(screen.getByLabelText('State')).toBeDisabled();
  });
});
