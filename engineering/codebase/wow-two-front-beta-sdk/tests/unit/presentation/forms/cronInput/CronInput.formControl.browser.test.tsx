import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { CronInput } from '@src/presentation/forms/cronInput/CronInput';

/*
 * F-2b grouped-choices regression — CronInput is the single-control composite
 * of the family: the inner input adopts the context id directly (a `Field`
 * label's `htmlFor` FOCUSES it), plus describedby, the invalid surface, and
 * the disabled/read-only/required flags.
 */

afterEach(cleanup);

function renderCron(fieldProps: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Schedule" helper="Five cron fields" {...fieldProps}>
      <CronInput />
    </Field>,
  );
}

describe('CronInput — FormControlContext', () => {
  it('the inner input takes the context id + helper reference', () => {
    renderCron();
    // `getByLabelText` proves Label.htmlFor ↔ input id through the context.
    const input = screen.getByLabelText('Schedule');
    const helper = screen.getByText('Five cron fields');
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('context invalid sets aria-invalid, describedby follows the error chrome', () => {
    renderCron({ error: 'Unsupported cron expression' });
    const input = screen.getByLabelText('Schedule');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('a locally invalid expression still wins over a clean context', () => {
    render(
      <Field label="Schedule">
        <CronInput defaultValue="not a cron" />
      </Field>,
    );
    expect(screen.getByLabelText('Schedule')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disabled / read-only / required flags cascade to the input', () => {
    renderCron({ isDisabled: true, isReadOnly: true, isRequired: true });
    const input = screen.getByLabelText(/Schedule/);
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(input).toBeRequired();
  });
});
