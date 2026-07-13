import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { IconPicker } from '@src/presentation/forms/iconPicker/IconPicker';

/*
 * F-2b regression — Family 1 deviation: IconPicker is an inline panel, not a
 * popover trigger. The `role="group"` grid is the control — it takes the
 * context id, is named via `aria-labelledby`, and described via
 * `aria-describedby`. `aria-invalid` is not valid on `group`; invalid state
 * surfaces through the describedby swap to the error chrome. Disabled flows
 * to the search input + icon buttons.
 */

afterEach(cleanup);

describe('IconPicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field on the group; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Icon" helper="Shown in the sidebar">
        <IconPicker />
      </Field>,
    );

    const group = screen.getByRole('group');
    const label = screen.getByText('Icon');
    const helper = screen.getByText('Shown in the sidebar');
    // Id chain: the Field-rendered Label's htmlFor resolves to the group node.
    expect(label).toHaveAttribute('for', group.id);
    // The Field label replaces the built-in 'Icons' fallback name.
    expect(group).toHaveAttribute('aria-labelledby', label.id);
    expect(group).not.toHaveAttribute('aria-label');
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(screen.getByRole('searchbox')).toBeEnabled();

    // Invalid propagation surfaces via the describedby swap (aria-invalid is invalid on `group`).
    view.rerender(
      <Field label="Icon" helper="Shown in the sidebar" error="Required">
        <IconPicker />
      </Field>,
    );
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    // Disabled flows to the search input and every icon button.
    view.rerender(
      <Field label="Icon" helper="Shown in the sidebar" isDisabled>
        <IconPicker />
      </Field>,
    );
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getAllByRole('button')[0]).toBeDisabled();
  });
});
