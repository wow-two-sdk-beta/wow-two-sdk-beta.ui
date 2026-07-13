import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { MarkdownEditor } from '@src/presentation/forms/markdownEditor/MarkdownEditor';

/*
 * F-2b regression — editors family: `MarkdownEditor` wires the EDITING surface
 * (textarea) to FormControlContext — the `role="group"` preview pane stays
 * description-free (it is chrome, not the control). Invalid + disabled/readOnly
 * cascade; toolbar follows the flags. Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('MarkdownEditor — FormControlContext wiring', () => {
  it('wires the textarea (not the preview group): id chain + aria-describedby', () => {
    render(
      <Field label="Notes" helper="Markdown supported">
        <MarkdownEditor defaultValue="# Hi" />
      </Field>,
    );
    const surface = screen.getByLabelText('Notes');
    expect(surface.tagName).toBe('TEXTAREA');
    expect(surface.getAttribute('aria-describedby')).toBe(
      screen.getByText('Markdown supported').id,
    );
    // The preview pane is NOT the editing surface — description stays off it.
    const preview = screen.getByRole('group', { name: 'Preview' });
    expect(preview).not.toHaveAttribute('aria-describedby');
    expect(surface).not.toHaveAttribute('aria-invalid');
  });

  it('cascades invalid: aria-invalid + invalid surface + describedby swaps to the error node', () => {
    render(
      <Field label="Notes" helper="Markdown supported" error="Required field">
        <MarkdownEditor defaultView="edit" />
      </Field>,
    );
    const surface = screen.getByLabelText('Notes');
    expect(surface).toHaveAttribute('aria-invalid', 'true');
    expect(surface.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(screen.queryByText('Markdown supported')).toBeNull();
  });

  it('cascades disabled to the textarea AND the formatting toolbar; readOnly likewise', () => {
    const { unmount } = render(
      <Field label="Notes" isDisabled>
        <MarkdownEditor defaultValue="text" defaultView="edit" />
      </Field>,
    );
    expect(screen.getByLabelText('Notes')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
    unmount();

    render(
      <Field label="Notes" isReadOnly>
        <MarkdownEditor defaultValue="text" defaultView="edit" />
      </Field>,
    );
    expect(screen.getByLabelText('Notes')).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
  });
});
