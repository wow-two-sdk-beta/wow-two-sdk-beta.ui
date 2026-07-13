import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { ColorPicker } from '@src/presentation/forms/colorPicker/ColorPicker';

/*
 * F-2b regression — popover-trigger family: both built-in triggers (full button,
 * bare swatch) adopt the FormControlContext block (id / aria-labelledby /
 * aria-describedby / aria-invalid / disabled) from a surrounding `Field`; the
 * default `aria-label` steps aside when a Field label names the trigger.
 */

afterEach(cleanup);

describe('ColorPicker — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(
      <Field label="Accent" helper="Brand color">
        <ColorPicker />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Accent');
    const helper = screen.getByText('Brand color');
    expect(label).toHaveAttribute('for', trigger.id);
    // The Field label names the trigger — the built-in 'Pick a color' fallback steps aside.
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger).not.toHaveAttribute('aria-label');
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    view.rerender(
      <Field label="Accent" helper="Brand color" error="Required">
        <ColorPicker />
      </Field>,
    );
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    view.rerender(
      <Field label="Accent" helper="Brand color" isDisabled>
        <ColorPicker />
      </Field>,
    );
    expect(trigger).toBeDisabled();
  });

  it('wires the bare swatch trigger variant the same way', () => {
    render(
      <Field label="Accent" helper="Brand color">
        <ColorPicker triggerVariant="swatch" />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Accent');
    expect(label).toHaveAttribute('for', trigger.id);
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByText('Brand color').id);
  });

  it('keeps the panel sub-controls off the field id — the trigger id stays unique while open', async () => {
    render(
      <Field label="Accent" helper="Brand color">
        <ColorPicker presets={['#ff0000', '#00ff00']} hasAlpha />
      </Field>,
    );

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);
    // Area + hue/alpha sliders + hex field + presets group all read `id ?? ctx.id` —
    // each is isolated behind its own bare provider, so none duplicates the trigger id.
    await waitFor(() => expect(screen.getByLabelText('Hex color')).toBeVisible());
    expect(document.querySelectorAll(`[id="${trigger.id}"]`)).toHaveLength(1);
    expect(screen.getByLabelText('Hex color')).not.toHaveAttribute(
      'aria-describedby',
      screen.getByText('Brand color').id,
    );
  });
});
