import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';

import { FileUpload } from './FileUpload';

/*
 * F-2b regression — file family: the HIDDEN native input carries the context
 * id (Field labels/describedby reference it; label click opens the picker),
 * flags cascade to it, and the dropzone tab stop mirrors the description.
 */

afterEach(cleanup);

describe('FileUpload × FormControlContext', () => {
  it('adopts the Field id chain — label reaches the hidden input, dropzone mirrors describedby', () => {
    render(
      <Field label="Attachments" helper="PDF up to 5 MB" isRequired>
        <FileUpload />
      </Field>,
    );

    const input = screen.getByLabelText(/^Attachments/); // Label.htmlFor ↔ hidden native input
    expect(input).toHaveAttribute('type', 'file');
    const helper = screen.getByText('PDF up to 5 MB');
    expect(input.getAttribute('aria-describedby')).toBe(helper.id);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button').getAttribute('aria-describedby')).toBe(helper.id);
  });

  it('cascades invalid + disabled — describedby swaps to the error node, dropzone leaves the tab order', () => {
    render(
      <Field label="Attachments" error="File too large" isDisabled>
        <FileUpload />
      </Field>,
    );

    const input = screen.getByLabelText('Attachments');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(input).toBeDisabled();

    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('aria-disabled', 'true');
    expect(dropzone).toHaveAttribute('tabindex', '-1');
    expect(dropzone.getAttribute('aria-describedby')).toBe(alert.id);
  });
});
