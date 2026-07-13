import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { TimePicker } from '@src/presentation/forms/timePicker/TimePicker';

/*
 * F-2b regression — popover-trigger family: the trigger adopts the
 * FormControlContext block (id / aria-labelledby / aria-describedby /
 * aria-invalid / disabled) from a surrounding `Field`, referencing only
 * chrome that is actually rendered (Field.formChrome pattern).
 */

afterEach(cleanup);

describe('TimePicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Time" helper="24-hour format">
        <TimePicker />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Time');
    const helper = screen.getByText('24-hour format');
    expect(label).toHaveAttribute('for', trigger.id);
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    view.rerender(
      <Field label="Time" helper="24-hour format" error="Required">
        <TimePicker />
      </Field>,
    );
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    view.rerender(
      <Field label="Time" helper="24-hour format" isDisabled>
        <TimePicker />
      </Field>,
    );
    expect(trigger).toBeDisabled();
  });
});
