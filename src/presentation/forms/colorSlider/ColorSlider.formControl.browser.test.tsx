import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { ColorSlider } from './ColorSlider';

/*
 * F-2b regression — slider-widgets family: `ColorSlider` (ARIA `role="slider"` track)
 * inside `Field` honors FormControlContext (context id on the track, name via
 * aria-labelledby, describedby references only rendered chrome, invalid + disabled
 * cascade). Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('ColorSlider — FormControlContext wiring', () => {
  it('takes the context id + Field label via aria-labelledby + helper via aria-describedby', () => {
    render(
      <Field label="Hue" helper="0 to 360 degrees">
        <ColorSlider channel="hue" defaultValue={120} />
      </Field>,
    );
    const track = screen.getByRole('slider', { name: 'Hue' });
    const label = screen.getByText('Hue');
    expect(label).toHaveAttribute('for', track.id);
    expect(track.getAttribute('aria-labelledby')).toBe(label.id);
    expect(track).not.toHaveAttribute('aria-label');
    expect(track.getAttribute('aria-describedby')).toBe(screen.getByText('0 to 360 degrees').id);
    expect(track).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + describedby swaps to the error node only', () => {
    render(
      <Field label="Hue" helper="0 to 360 degrees" error="Out of gamut">
        <ColorSlider channel="hue" defaultValue={120} />
      </Field>,
    );
    const track = screen.getByRole('slider', { name: 'Hue' });
    expect(track).toHaveAttribute('aria-invalid', 'true');
    expect(track.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('0 to 360 degrees')).toBeNull();
  });

  it('cascades disabled; an explicit aria-label beats the Field label', () => {
    render(
      <Field label="Hue" isDisabled>
        <ColorSlider channel="alpha" defaultValue={0.5} aria-label="Opacity" />
      </Field>,
    );
    const track = screen.getByRole('slider', { name: 'Opacity' });
    expect(track).toHaveAttribute('aria-disabled', 'true');
    expect(track).toHaveAttribute('tabindex', '-1');
    expect(track).not.toHaveAttribute('aria-labelledby');
  });
});
