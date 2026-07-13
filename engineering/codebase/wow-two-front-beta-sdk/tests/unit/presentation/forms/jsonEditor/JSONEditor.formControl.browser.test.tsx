import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';

import { JSONEditor } from '@src/presentation/forms/jsonEditor/JSONEditor';

/*
 * F-2b regression — editors family: `JSONEditor`'s DUAL editing surfaces honor
 * FormControlContext — text mode wires the raw textarea (context id, Field label
 * beats the built-in "JSON source" name, describedby), tree mode wires the tree +
 * the transient leaf-edit input. Invalid + disabled/readOnly cascade.
 * Pattern: Field.formChrome.browser.test.tsx.
 */

afterEach(cleanup);

describe('JSONEditor — FormControlContext wiring', () => {
  it('text mode: textarea takes the context id, the Field label names it, helper describes it', () => {
    render(
      <Field label="Payload" helper="Valid JSON only">
        <JSONEditor defaultMode="text" defaultValue={{ a: 1 }} />
      </Field>,
    );
    // aria-labelledby (Field label) must beat the built-in aria-label="JSON source".
    const surface = screen.getByRole('textbox', { name: 'Payload' });
    const label = screen.getByText('Payload');
    expect(label).toHaveAttribute('for', surface.id);
    expect(surface.getAttribute('aria-describedby')).toBe(screen.getByText('Valid JSON only').id);
    expect(surface).not.toHaveAttribute('aria-invalid');
  });

  it('tree mode: the tree is named/described by the Field chrome and anchors the context id', () => {
    render(
      <Field label="Payload" helper="Valid JSON only">
        <JSONEditor defaultValue={{ a: 1 }} />
      </Field>,
    );
    const tree = screen.getByRole('tree', { name: 'Payload' });
    expect(tree).toHaveAttribute('id', screen.getByText('Payload').getAttribute('for'));
    expect(tree.getAttribute('aria-describedby')).toBe(screen.getByText('Valid JSON only').id);
  });

  it('tree mode: the transient leaf-edit input inherits the field description', () => {
    render(
      <Field label="Payload" helper="Valid JSON only">
        <JSONEditor defaultValue={{ a: 1 }} />
      </Field>,
    );
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    const editInput = screen.getByLabelText('Edit value');
    expect(editInput.getAttribute('aria-describedby')).toBe(
      screen.getByText('Valid JSON only').id,
    );
  });

  it('cascades invalid (both modes) + disabled/readOnly to the text surface', () => {
    const { unmount } = render(
      <Field label="Payload" error="Schema mismatch">
        <JSONEditor defaultMode="text" defaultValue={{ a: 1 }} />
      </Field>,
    );
    const surface = screen.getByRole('textbox', { name: 'Payload' });
    expect(surface).toHaveAttribute('aria-invalid', 'true');
    expect(surface.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    unmount();

    render(
      <Field label="Payload" error="Schema mismatch">
        <JSONEditor defaultValue={{ a: 1 }} />
      </Field>,
    );
    expect(screen.getByRole('tree', { name: 'Payload' })).toHaveAttribute('aria-invalid', 'true');
    cleanup();

    render(
      <Field label="Payload" isDisabled isReadOnly>
        <JSONEditor defaultMode="text" defaultValue={{ a: 1 }} />
      </Field>,
    );
    const flagged = screen.getByRole('textbox', { name: 'Payload' });
    expect(flagged).toBeDisabled();
    expect(flagged).toHaveAttribute('readonly');
  });
});
