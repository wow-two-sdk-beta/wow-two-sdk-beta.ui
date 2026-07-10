import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';
import { MultiSelect } from './MultiSelect';

/*
 * F-2b regression — popover-trigger family: the trigger adopts the
 * FormControlContext block (id / aria-labelledby / aria-describedby /
 * aria-invalid / disabled) from a surrounding `Field` via the MultiSelect
 * root context, referencing only chrome that is actually rendered.
 */

afterEach(cleanup);

function renderPicker(fieldProps: { error?: string; isDisabled?: boolean } = {}) {
  return (
    <Field label="Tags" helper="Pick any" {...fieldProps}>
      <MultiSelect>
        <MultiSelect.Trigger />
        <MultiSelect.Content>
          <MultiSelect.Item value="a">Alpha</MultiSelect.Item>
        </MultiSelect.Content>
      </MultiSelect>
    </Field>
  );
}

describe('MultiSelect — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(renderPicker());

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Tags');
    const helper = screen.getByText('Pick any');
    expect(label).toHaveAttribute('for', trigger.id);
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    view.rerender(renderPicker({ error: 'Pick at least one' }));
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    view.rerender(renderPicker({ isDisabled: true }));
    expect(trigger).toBeDisabled();
  });
});
