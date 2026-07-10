import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { PinInput } from './PinInput';

/*
 * F-2b regression — text-composites family: the FIRST cell is the composite's
 * primary input (context id + describedby land there), flags cascade to every
 * cell, and the built-in per-digit aria-labels stay intact.
 */

afterEach(cleanup);

describe('PinInput × FormControlContext', () => {
  it('puts the context id/describedby on the first cell and keeps per-digit labels', () => {
    render(
      <Field label="Code" helper="Check your email" isRequired>
        <PinInput length={4} />
      </Field>,
    );

    const cells = screen.getAllByLabelText(/^Digit \d of 4$/); // built-in aria intact
    expect(cells).toHaveLength(4);
    const label = screen.getByText('Code');
    expect(label).toHaveAttribute('for', cells[0]!.id); // Label.htmlFor ↔ primary cell

    const helper = screen.getByText('Check your email');
    expect(cells[0]!.getAttribute('aria-describedby')).toBe(helper.id);
    expect(cells[0]).toHaveAttribute('aria-required', 'true');
    expect(cells[1]).not.toHaveAttribute('aria-describedby');
    expect(cells[0]).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid + disabled onto every cell — describedby swaps to the error node', () => {
    render(
      <Field label="Code" error="Wrong code" isDisabled>
        <PinInput length={4} />
      </Field>,
    );

    const cells = screen.getAllByLabelText(/^Digit \d of 4$/);
    const alert = screen.getByRole('alert');
    for (const cell of cells) {
      expect(cell).toHaveAttribute('aria-invalid', 'true');
      expect(cell).toBeDisabled();
    }
    expect(cells[0]!.getAttribute('aria-describedby')).toBe(alert.id);
  });
});
