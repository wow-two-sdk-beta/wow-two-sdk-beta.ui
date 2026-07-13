import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { ColorSwatchPicker } from '@src/presentation/forms/colorSwatchPicker/ColorSwatchPicker';

/*
 * F-2b regression — Family 1 deviation: ColorSwatchPicker is an inline swatch
 * group, not a popover trigger. The `role="group"` node is the control — it
 * takes the context id, is named via `aria-labelledby`, and described via
 * `aria-describedby`. `aria-invalid` is not valid on `group`; invalid state
 * surfaces through the describedby swap to the error chrome. Disabled flows
 * to every swatch button.
 */

afterEach(cleanup);

const COLORS = ['#ff0000', '#00ff00', '#0000ff'];

describe('ColorSwatchPicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field on the group; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Swatch" helper="Preset colors">
        <ColorSwatchPicker colors={COLORS} />
      </Field>,
    );

    const group = screen.getByRole('group');
    const label = screen.getByText('Swatch');
    const helper = screen.getByText('Preset colors');
    // Id chain: the Field-rendered Label's htmlFor resolves to the group node.
    expect(label).toHaveAttribute('for', group.id);
    expect(group).toHaveAttribute('aria-labelledby', label.id);
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(screen.getAllByRole('button')).toHaveLength(COLORS.length);
    expect(screen.getAllByRole('button')[0]).toBeEnabled();

    // Invalid propagation surfaces via the describedby swap (aria-invalid is invalid on `group`).
    view.rerender(
      <Field label="Swatch" helper="Preset colors" error="Required">
        <ColorSwatchPicker colors={COLORS} />
      </Field>,
    );
    expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    // Disabled flows to every swatch button.
    view.rerender(
      <Field label="Swatch" helper="Preset colors" isDisabled>
        <ColorSwatchPicker colors={COLORS} />
      </Field>,
    );
    for (const swatch of screen.getAllByRole('button')) expect(swatch).toBeDisabled();
  });
});
