import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { Knob } from '@src/presentation/forms/knob/Knob';

/*
 * F-2b regression — slider-widgets family: `Knob` (ARIA `role="slider"` widget) inside
 * `Field` honors FormControlContext (context id, name via aria-labelledby, describedby
 * references only rendered chrome, invalid + disabled cascade).
 * Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('Knob — FormControlContext wiring', () => {
  it('takes the context id + Field label via aria-labelledby + helper via aria-describedby', () => {
    render(
      <Field label="Gain" helper="Drag up to boost">
        <Knob defaultValue={0.5} />
      </Field>,
    );
    const knob = screen.getByRole('slider', { name: 'Gain' });
    const label = screen.getByText('Gain');
    expect(label).toHaveAttribute('for', knob.id);
    expect(knob.getAttribute('aria-labelledby')).toBe(label.id);
    expect(knob).not.toHaveAttribute('aria-label');
    expect(knob.getAttribute('aria-describedby')).toBe(screen.getByText('Drag up to boost').id);
    expect(knob).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + describedby swaps to the error node only', () => {
    render(
      <Field label="Gain" helper="Drag up to boost" error="Clipping">
        <Knob defaultValue={0.9} />
      </Field>,
    );
    const knob = screen.getByRole('slider', { name: 'Gain' });
    expect(knob).toHaveAttribute('aria-invalid', 'true');
    expect(knob.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('Drag up to boost')).toBeNull();
  });

  it('cascades disabled; an explicit aria-label beats the Field label', () => {
    render(
      <Field label="Gain" isDisabled>
        <Knob defaultValue={0.5} aria-label="Master gain" />
      </Field>,
    );
    const knob = screen.getByRole('slider', { name: 'Master gain' });
    expect(knob).toHaveAttribute('aria-disabled', 'true');
    expect(knob).toHaveAttribute('tabindex', '-1');
    expect(knob).not.toHaveAttribute('aria-labelledby');
  });
});
