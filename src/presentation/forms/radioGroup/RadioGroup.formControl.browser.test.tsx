import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '../field/Field';
import { RadioField } from '../radioField/RadioField';

import { RadioGroup } from './RadioGroup';

/*
 * F-2b grouped-choices regression — group-level FormControlContext wiring.
 * The fieldset (explicit `radiogroup` role) adopts the context id +
 * labelledBy/describedBy + aria-invalid; disabled/invalid cascade to the items;
 * the items keep UNIQUE ids and the SHARED `name` — the native mechanism behind
 * arrow-key roving between radios (earlier-wave behavior, must not regress).
 */

afterEach(cleanup);

function renderGroup(fieldProps: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Plan" helper="Pick one" {...fieldProps}>
      <RadioGroup defaultValue="pro">
        <RadioField value="free" label="Free" />
        <RadioField value="pro" label="Pro" />
        <RadioField value="team" label="Team" />
      </RadioGroup>
    </Field>,
  );
}

describe('RadioGroup — FormControlContext (group wiring)', () => {
  it('the radiogroup node takes the context id + label/helper references', () => {
    renderGroup();
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const label = screen.getByText('Plan');
    const helper = screen.getByText('Pick one');
    // `Label htmlFor` resolves onto the group container (labelledBy composition names it).
    expect(label).toHaveAttribute('for', group.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('items keep unique ids and the shared name (native arrow-key roving intact)', () => {
    renderGroup();
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    const ids = radios.map((radio) => radio.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    // One shared name across all radios — the native mutex + arrow-nav mechanism.
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    for (const radio of radios) {
      expect(radio.id).not.toBe(group.id);
      expect(radio).not.toHaveAttribute('aria-describedby');
    }
    // Item labels still reach their own control; group selection preserved.
    expect(screen.getByLabelText('Pro')).toBeChecked();
  });

  it('invalid lands on the radiogroup node and cascades to the items', () => {
    renderGroup({ error: 'Pick a plan' });
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const alert = screen.getByRole('alert');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toBe(alert.id);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-invalid', 'true');
    }
  });

  it('disabled cascades to every item (fieldset-disabled pattern)', () => {
    renderGroup({ isDisabled: true });
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });
});
