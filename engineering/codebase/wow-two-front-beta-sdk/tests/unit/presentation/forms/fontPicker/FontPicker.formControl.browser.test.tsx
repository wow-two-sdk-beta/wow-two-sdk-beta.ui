import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { FontPicker } from '@src/presentation/forms/fontPicker/FontPicker';

/*
 * F-2b regression — popover-trigger family: the trigger button (not the wrapper
 * div) adopts the FormControlContext block (id / aria-labelledby /
 * aria-describedby / aria-invalid / disabled) from a surrounding `Field`.
 */

afterEach(cleanup);

describe('FontPicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Heading font" helper="Used for titles">
        <FontPicker />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Heading font');
    const helper = screen.getByText('Used for titles');
    expect(label).toHaveAttribute('for', trigger.id);
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    view.rerender(
      <Field label="Heading font" helper="Used for titles" error="Required">
        <FontPicker />
      </Field>,
    );
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    view.rerender(
      <Field label="Heading font" helper="Used for titles" isDisabled>
        <FontPicker />
      </Field>,
    );
    expect(trigger).toBeDisabled();
  });
});
