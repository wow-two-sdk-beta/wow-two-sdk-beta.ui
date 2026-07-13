import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { ColorArea } from '@src/presentation/forms/colorArea/ColorArea';

/*
 * F-2b regression — slider-widgets family: `ColorArea` (2D ARIA `role="slider"`
 * surface) inside `Field` honors FormControlContext (context id, name via
 * aria-labelledby, describedby references only rendered chrome, invalid + disabled
 * cascade). Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('ColorArea — FormControlContext wiring', () => {
  it('takes the context id + Field label via aria-labelledby + helper via aria-describedby', () => {
    render(
      <Field label="Shade" helper="Pick saturation and value">
        <ColorArea hue={200} />
      </Field>,
    );
    const area = screen.getByRole('slider', { name: 'Shade' });
    const label = screen.getByText('Shade');
    expect(label).toHaveAttribute('for', area.id);
    expect(area.getAttribute('aria-labelledby')).toBe(label.id);
    expect(area).not.toHaveAttribute('aria-label');
    expect(area.getAttribute('aria-describedby')).toBe(
      screen.getByText('Pick saturation and value').id,
    );
    expect(area).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + describedby swaps to the error node only', () => {
    render(
      <Field label="Shade" helper="Pick saturation and value" error="Too dark">
        <ColorArea hue={200} />
      </Field>,
    );
    const area = screen.getByRole('slider', { name: 'Shade' });
    expect(area).toHaveAttribute('aria-invalid', 'true');
    expect(area.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('Pick saturation and value')).toBeNull();
  });

  it('cascades disabled; an explicit aria-label beats the Field label', () => {
    render(
      <Field label="Shade" isDisabled>
        <ColorArea hue={200} aria-label="SV picker" />
      </Field>,
    );
    const area = screen.getByRole('slider', { name: 'SV picker' });
    expect(area).toHaveAttribute('aria-disabled', 'true');
    expect(area).toHaveAttribute('tabindex', '-1');
    expect(area).not.toHaveAttribute('aria-labelledby');
  });
});
