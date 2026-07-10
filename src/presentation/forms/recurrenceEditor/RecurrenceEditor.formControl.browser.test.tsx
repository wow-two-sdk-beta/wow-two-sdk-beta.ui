import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { RecurrenceEditor } from './RecurrenceEditor';

/*
 * F-2b grouped-choices regression — group-level FormControlContext wiring.
 * The root (`role="group"`) adopts the context id + labelledBy/describedBy +
 * aria-invalid; disabled/read-only cascade to the inner controls. The inner
 * scoped groups (weekday `group`, end-mode `radiogroup`) keep their own names.
 */

afterEach(cleanup);

function renderEditor(fieldProps: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Repeat" helper="How often it runs" {...fieldProps}>
      <RecurrenceEditor />
    </Field>,
  );
}

describe('RecurrenceEditor — FormControlContext (group wiring)', () => {
  it('the group node takes the context id + label/helper references', () => {
    renderEditor();
    const group = screen.getByRole('group', { name: 'Repeat' });
    const label = screen.getByText('Repeat');
    const helper = screen.getByText('How often it runs');
    // `Label htmlFor` resolves onto the group container (labelledBy composition names it).
    expect(label).toHaveAttribute('for', group.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(group).not.toHaveAttribute('aria-invalid');
    // Inner scoped groups keep their own semantics under the wired root.
    expect(screen.getByRole('group', { name: 'Days of week' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'End mode' })).toBeInTheDocument();
  });

  it('invalid lands on the group node, describedby follows the error chrome', () => {
    renderEditor({ error: 'Pick an end date' });
    const group = screen.getByRole('group', { name: 'Repeat' });
    const alert = screen.getByRole('alert');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('disabled cascades to every inner control', () => {
    renderEditor({ isDisabled: true });
    expect(screen.getByLabelText('Every')).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Frequency' })).toBeDisabled();
    for (const weekday of screen.getAllByRole('checkbox')) expect(weekday).toBeDisabled();
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it('read-only cascades to the inner inputs and locks the toggles', () => {
    renderEditor({ isReadOnly: true });
    expect(screen.getByLabelText('Every')).toHaveAttribute('readonly');
    // Weekday toggles + end-mode radios lock via disabled while read-only.
    for (const weekday of screen.getAllByRole('checkbox')) expect(weekday).toBeDisabled();
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });
});
