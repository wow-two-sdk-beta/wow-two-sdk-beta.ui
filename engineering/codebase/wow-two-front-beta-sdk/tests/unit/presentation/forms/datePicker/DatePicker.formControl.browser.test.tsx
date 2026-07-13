import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { DatePicker } from '@src/presentation/forms/datePicker/DatePicker';

/*
 * F-2b regression — popover-trigger family: the trigger adopts the
 * FormControlContext block (id / aria-labelledby / aria-describedby /
 * aria-invalid / disabled) from a surrounding `Field`, referencing only
 * chrome that is actually rendered (Field.formChrome pattern).
 */

afterEach(cleanup);

describe('DatePicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Date" helper="Pick a day">
        <DatePicker />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Date');
    const helper = screen.getByText('Pick a day');
    // Id chain: the Field-rendered Label's htmlFor hits the trigger (id ?? ctx.id).
    expect(label).toHaveAttribute('for', trigger.id);
    // A button trigger is named via the mounted label's id, not htmlFor.
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    // Describedby references exactly the rendered helper — nothing dangling.
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    // Invalid propagation: error chrome replaces the helper, describedby follows.
    view.rerender(
      <Field label="Date" helper="Pick a day" error="Required">
        <DatePicker />
      </Field>,
    );
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    // Disabled flag flows from the Field.
    view.rerender(
      <Field label="Date" helper="Pick a day" isDisabled>
        <DatePicker />
      </Field>,
    );
    expect(trigger).toBeDisabled();
  });
});
