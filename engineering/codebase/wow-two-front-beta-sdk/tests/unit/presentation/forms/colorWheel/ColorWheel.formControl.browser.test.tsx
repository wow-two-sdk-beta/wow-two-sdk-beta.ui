import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { ColorWheel } from '@src/presentation/forms/colorWheel/ColorWheel';

/*
 * F-2b regression — slider-widgets family: `ColorWheel` (circular ARIA `role="slider"`)
 * inside `Field` honors FormControlContext (context id, name via aria-labelledby,
 * describedby references only rendered chrome, invalid + disabled cascade).
 * Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('ColorWheel — FormControlContext wiring', () => {
  it('takes the context id + Field label via aria-labelledby + helper via aria-describedby', () => {
    render(
      <Field label="Wheel hue" helper="Rotate to pick">
        <ColorWheel defaultValue={90} />
      </Field>,
    );
    const wheel = screen.getByRole('slider', { name: 'Wheel hue' });
    const label = screen.getByText('Wheel hue');
    expect(label).toHaveAttribute('for', wheel.id);
    expect(wheel.getAttribute('aria-labelledby')).toBe(label.id);
    expect(wheel).not.toHaveAttribute('aria-label');
    expect(wheel.getAttribute('aria-describedby')).toBe(screen.getByText('Rotate to pick').id);
    expect(wheel).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + describedby swaps to the error node only', () => {
    render(
      <Field label="Wheel hue" helper="Rotate to pick" error="Reserved hue">
        <ColorWheel defaultValue={90} />
      </Field>,
    );
    const wheel = screen.getByRole('slider', { name: 'Wheel hue' });
    expect(wheel).toHaveAttribute('aria-invalid', 'true');
    expect(wheel.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('Rotate to pick')).toBeNull();
  });

  it('cascades disabled; an explicit aria-label beats the Field label', () => {
    render(
      <Field label="Wheel hue" isDisabled>
        <ColorWheel defaultValue={90} aria-label="Accent hue" />
      </Field>,
    );
    const wheel = screen.getByRole('slider', { name: 'Accent hue' });
    expect(wheel).toHaveAttribute('aria-disabled', 'true');
    expect(wheel).toHaveAttribute('tabindex', '-1');
    expect(wheel).not.toHaveAttribute('aria-labelledby');
  });
});
