import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { TagsInput } from './TagsInput';

/*
 * F-2b regression — text-composites family: the inner input (the composite's
 * primary control) adopts the FormControlContext, so `Field`-rendered chrome
 * reaches the real focusable — id chain, describedby, invalid + flag cascade.
 */

afterEach(cleanup);

describe('TagsInput × FormControlContext', () => {
  it('adopts the Field id chain — label reaches the inner input, describedby references the helper', () => {
    render(
      <Field label="Tags" helper="Press Enter to commit" isRequired>
        <TagsInput />
      </Field>,
    );

    const input = screen.getByLabelText(/^Tags/); // Label.htmlFor ↔ inner input id
    const helper = screen.getByText('Press Enter to commit');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid + disabled — describedby swaps to the error node', () => {
    render(
      <Field label="Tags" helper="Press Enter to commit" error="Add at least one tag" isDisabled>
        <TagsInput />
      </Field>,
    );

    const input = screen.getByLabelText('Tags');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input).toBeDisabled();
  });
});
