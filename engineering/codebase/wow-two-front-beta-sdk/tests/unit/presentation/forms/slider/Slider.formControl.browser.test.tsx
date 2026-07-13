import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { Slider } from '@src/presentation/forms/slider/Slider';

/*
 * F-2b regression — slider-widgets family: the native range `Slider` inside `Field`
 * honors FormControlContext (id chain via Label htmlFor, describedby references only
 * rendered chrome, invalid + flags cascade). Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('Slider — FormControlContext wiring', () => {
  it('takes the context id (Label htmlFor chain) + helper via aria-describedby', () => {
    render(
      <Field label="Volume" helper="Drag to adjust">
        <Slider defaultValue={40} />
      </Field>,
    );
    const slider = screen.getByLabelText('Volume');
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider.getAttribute('aria-describedby')).toBe(screen.getByText('Drag to adjust').id);
    expect(slider).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + describedby swaps to the error node only', () => {
    render(
      <Field label="Volume" helper="Drag to adjust" error="Too loud">
        <Slider defaultValue={40} />
      </Field>,
    );
    const slider = screen.getByLabelText('Volume');
    expect(slider).toHaveAttribute('aria-invalid', 'true');
    expect(slider.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('Drag to adjust')).toBeNull();
  });

  it('cascades disabled + required from the Field flags', () => {
    render(
      <Field label="Volume" isDisabled isRequired>
        <Slider defaultValue={40} />
      </Field>,
    );
    const slider = screen.getByLabelText(/Volume/);
    expect(slider).toBeDisabled();
    // `required` has no constraint semantics on type=range — assert the cascade at attribute level.
    expect(slider).toHaveAttribute('required');
  });
});
