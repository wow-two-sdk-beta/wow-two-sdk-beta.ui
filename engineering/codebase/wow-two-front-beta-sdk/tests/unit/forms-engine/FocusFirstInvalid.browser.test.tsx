import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from '@src/presentation/actions';
import { Field, TextInput } from '@src/presentation/forms';

import type { FormEngine } from '@src/forms-engine/AppForm';
import { focusFirstInvalid } from '@src/forms-engine/FocusFirstInvalid';
import type { StandardSchemaV1 } from '@src/forms-engine/StandardSchema';
import { useAppForm as useHouseAppForm } from '@src/forms-engine/house';
import { useAppForm as useTanstackAppForm } from '@src/forms-engine/tanstack';

/*
 * `focusFirstInvalid` — DOM-order selection + focusability rules on plain fixtures,
 * then the recipe wiring end-to-end on BOTH engine adapters (the helper is
 * contract-neutral: it reads the FormControlContext-stamped `aria-invalid`, so
 * engine parity is by construction — these two cases pin it).
 */

const roots: HTMLElement[] = [];

/** Mounts a raw HTML fixture and returns its root (removed after each test). */
function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  roots.push(root);
  return root;
}

afterEach(() => {
  cleanup();
  for (const root of roots.splice(0)) root.remove();
});

describe('focusFirstInvalid — selection rules', () => {
  it('focuses the first invalid control in DOM order and returns it', () => {
    const root = mount(`
      <input id="a" />
      <input id="b" aria-invalid="true" />
      <input id="c" aria-invalid="true" />
    `);

    const focused = focusFirstInvalid(root);

    expect(focused).toBe(root.querySelector('#b'));
    expect(root.querySelector('#b')).toHaveFocus();
  });

  it('returns null and leaves focus untouched when nothing is invalid', () => {
    const root = mount('<input id="a" /><input id="b" />');
    (root.querySelector('#b') as HTMLElement).focus();

    expect(focusFirstInvalid(root)).toBeNull();
    expect(root.querySelector('#b')).toHaveFocus();
  });

  it('returns null for a missing root', () => {
    expect(focusFirstInvalid(null)).toBeNull();
    expect(focusFirstInvalid(undefined)).toBeNull();
  });

  it('skips disabled and aria-disabled invalid controls', () => {
    const root = mount(`
      <input id="a" aria-invalid="true" disabled />
      <div id="b" role="slider" tabindex="0" aria-invalid="true" aria-disabled="true"></div>
      <input id="c" aria-invalid="true" />
    `);

    expect(focusFirstInvalid(root)).toBe(root.querySelector('#c'));
    expect(root.querySelector('#c')).toHaveFocus();
  });

  it('skips non-focusable invalid markers but focuses an ARIA widget with a tabindex', () => {
    const root = mount(`
      <div id="group" role="group" aria-invalid="true"></div>
      <div id="slider" role="slider" tabindex="0" aria-invalid="true"></div>
    `);

    expect(focusFirstInvalid(root)).toBe(root.querySelector('#slider'));
    expect(root.querySelector('#slider')).toHaveFocus();
  });

  it('skips an invalid control focus cannot land on (display:none) and takes the next', () => {
    const root = mount(`
      <input id="hidden" aria-invalid="true" style="display:none" />
      <input id="visible" aria-invalid="true" />
    `);

    expect(focusFirstInvalid(root)).toBe(root.querySelector('#visible'));
    expect(root.querySelector('#visible')).toHaveFocus();
  });

  it('reaches a visually-hidden but focusable control (the FileUpload hidden-input shape)', () => {
    const root = mount(`
      <input id="sr" aria-invalid="true" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)" />
    `);

    expect(focusFirstInvalid(root)).toBe(root.querySelector('#sr'));
    expect(root.querySelector('#sr')).toHaveFocus();
  });
});

/* ────────── Engine parity — the recipe wiring on both adapters ────────── */

interface DemoValues {
  name: string;
  email: string;
}

const DEMO_SCHEMA: StandardSchemaV1<DemoValues> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => {
      const values = value as DemoValues;
      const issues: StandardSchemaV1.Issue[] = [];
      if (values.name.trim() === '') issues.push({ message: 'Name is required.', path: ['name'] });
      if (!values.email.includes('@')) issues.push({ message: 'Enter a valid email.', path: ['email'] });
      return issues.length > 0 ? { issues } : { value: values };
    },
  },
};

function RecipeDemo({ useAppFormImpl }: { useAppFormImpl: FormEngine['useAppForm'] }) {
  const form = useAppFormImpl<DemoValues>({
    defaultValues: { name: '', email: '' },
    schema: DEMO_SCHEMA,
    onSubmit: async () => null,
  });
  return (
    <form
      onSubmit={(event) => {
        const root = event.currentTarget; // React nulls currentTarget after the handler — capture before the await.
        void form.handleSubmit(event).then(() => focusFirstInvalid(root));
      }}
    >
      <form.Field name="name">
        {(f) => (
          <Field label="Name">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <form.Field name="email">
        {(f) => (
          <Field label="Email">
            <TextInput value={f.value} onChange={(e) => f.setValue(e.target.value)} onBlur={f.onBlur} />
          </Field>
        )}
      </form.Field>
      <Button type="submit">Save</Button>
    </form>
  );
}

const engines: ReadonlyArray<[string, FormEngine['useAppForm']]> = [
  ['house', useHouseAppForm],
  ['tanstack', useTanstackAppForm],
];

describe.each(engines)('focusFirstInvalid × %s engine', (_, useAppFormImpl) => {
  it('lands focus on the first invalid control after a rejected submit, then on the next once fixed', async () => {
    const user = userEvent.setup();
    render(<RecipeDemo useAppFormImpl={useAppFormImpl} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveFocus());
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus());
  });
});
