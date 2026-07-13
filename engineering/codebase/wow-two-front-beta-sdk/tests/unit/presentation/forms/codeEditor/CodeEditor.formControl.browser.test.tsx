import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { CodeEditor } from '@src/presentation/forms/codeEditor/CodeEditor';

/*
 * F-2b regression — editors family: `CodeEditor`'s textarea surface inside `Field`
 * honors FormControlContext (context id via Label htmlFor, describedby references
 * only rendered chrome, invalid + disabled/readOnly/required cascade).
 * Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('CodeEditor — FormControlContext wiring', () => {
  it('takes the context id (Label htmlFor chain) + helper via aria-describedby', () => {
    render(
      <Field label="Script" helper="Runs on deploy">
        <CodeEditor defaultValue="const x = 1;" />
      </Field>,
    );
    const surface = screen.getByLabelText('Script');
    expect(surface.tagName).toBe('TEXTAREA');
    expect(surface.getAttribute('aria-describedby')).toBe(screen.getByText('Runs on deploy').id);
    expect(surface).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + invalid surface + describedby swaps to the error node', () => {
    render(
      <Field label="Script" helper="Runs on deploy" error="Syntax error">
        <CodeEditor defaultValue="const x =" />
      </Field>,
    );
    const surface = screen.getByLabelText('Script');
    expect(surface).toHaveAttribute('aria-invalid', 'true');
    expect(surface.parentElement).toHaveAttribute('data-state', 'invalid');
    expect(surface.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('Runs on deploy')).toBeNull();
  });

  it('cascades disabled + readOnly + required from the Field flags', () => {
    const { unmount } = render(
      <Field label="Script" isDisabled isRequired>
        <CodeEditor defaultValue="x" />
      </Field>,
    );
    const surface = screen.getByLabelText(/Script/);
    expect(surface).toBeDisabled();
    expect(surface).toBeRequired();
    unmount();

    render(
      <Field label="Script" isReadOnly>
        <CodeEditor defaultValue="x" />
      </Field>,
    );
    expect(screen.getByLabelText('Script')).toHaveAttribute('readonly');
  });
});
