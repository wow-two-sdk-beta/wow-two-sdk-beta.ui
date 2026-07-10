import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';
import { DateRangePicker } from './DateRangePicker';

/*
 * F-2b regression — popover-trigger family: the trigger adopts the
 * FormControlContext block (id / aria-labelledby / aria-describedby /
 * aria-invalid / disabled) from a surrounding `Field`, referencing only
 * chrome that is actually rendered (Field.formChrome pattern).
 */

afterEach(cleanup);

describe('DateRangePicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Stay" helper="Nights count">
        <DateRangePicker />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Stay');
    const helper = screen.getByText('Nights count');
    expect(label).toHaveAttribute('for', trigger.id);
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    view.rerender(
      <Field label="Stay" helper="Nights count" error="Required">
        <DateRangePicker />
      </Field>,
    );
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    view.rerender(
      <Field label="Stay" helper="Nights count" isDisabled>
        <DateRangePicker />
      </Field>,
    );
    expect(trigger).toBeDisabled();
  });
});
