import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { GradientPicker } from '@src/presentation/forms/gradientPicker/GradientPicker';

/*
 * F-2b grouped-choices regression — group-level FormControlContext wiring.
 * The root (`role="group"`) adopts the context id + labelledBy/describedBy +
 * aria-invalid; the disabled flag cascades to every inner control (kind radios,
 * angle/stop inputs, add/remove buttons).
 */

afterEach(cleanup);

function renderPicker(fieldProps: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Gradient" helper="Pick the surface fill" {...fieldProps}>
      <GradientPicker />
    </Field>,
  );
}

describe('GradientPicker — FormControlContext (group wiring)', () => {
  it('the group node takes the context id + label/helper references', () => {
    renderPicker();
    const group = screen.getByRole('group', { name: 'Gradient' });
    const label = screen.getByText('Gradient');
    const helper = screen.getByText('Pick the surface fill');
    // `Label htmlFor` resolves onto the group container (labelledBy composition names it).
    expect(label).toHaveAttribute('for', group.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(group).not.toHaveAttribute('aria-invalid');
    // The inner kind picker keeps its own scoped radiogroup semantics.
    expect(screen.getByRole('radiogroup', { name: 'Gradient kind' })).toBeInTheDocument();
  });

  it('invalid lands on the group node, describedby follows the error chrome', () => {
    renderPicker({ error: 'Gradient needs at least two stops' });
    const group = screen.getByRole('group', { name: 'Gradient' });
    const alert = screen.getByRole('alert');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('disabled cascades to every inner control', () => {
    renderPicker({ isDisabled: true });
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    expect(screen.getByLabelText(/angle/i)).toBeDisabled();
    for (const stopColor of screen.getAllByLabelText('Stop color')) expect(stopColor).toBeDisabled();
    for (const position of screen.getAllByLabelText('Stop position')) expect(position).toBeDisabled();
    for (const remove of screen.getAllByLabelText('Remove stop')) expect(remove).toBeDisabled();
    expect(screen.getByRole('button', { name: /add stop/i })).toBeDisabled();
  });
});
