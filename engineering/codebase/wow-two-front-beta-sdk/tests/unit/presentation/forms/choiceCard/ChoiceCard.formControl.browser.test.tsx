import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Field } from '@src/presentation/forms/field/Field';
import { RadioGroup } from '@src/presentation/forms/radioGroup/RadioGroup';

import { ChoiceCard } from '@src/presentation/forms/choiceCard/ChoiceCard';

/*
 * F-2b grouped-choices regression — ChoiceCard is the card-styled ITEM of the
 * family: standalone inside a `Field` it adopts the context id (the F-2a
 * `id ?? ctx?.id ?? generated` composite precedence), flags reach its radio via
 * context; inside a `RadioGroup` the per-item context keeps card ids unique.
 */

afterEach(cleanup);

describe('ChoiceCard — FormControlContext', () => {
  it('adopts the context id — a Field label reaches the card radio', () => {
    render(
      <Field label="Plan" helper="Pick one">
        <ChoiceCard label="Pro" description="Unlimited projects." />
      </Field>,
    );
    const radio = screen.getByRole('radio');
    const fieldLabel = screen.getByText('Plan');
    expect(fieldLabel).toHaveAttribute('for', radio.id);
  });

  it('invalid + disabled flags reach the radio through context', () => {
    render(
      <Field label="Plan" error="Pick a plan" isDisabled>
        <ChoiceCard label="Pro" />
      </Field>,
    );
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('aria-invalid', 'true');
    expect(radio).toBeDisabled();
  });

  it('inside a RadioGroup within a Field the cards keep unique ids', () => {
    render(
      <Field label="Plan" helper="Pick one">
        <RadioGroup defaultValue="pro">
          <ChoiceCard value="free" label="Free" />
          <ChoiceCard value="pro" label="Pro" />
          <ChoiceCard value="team" label="Team" />
        </RadioGroup>
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    const ids = radios.map((radio) => radio.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    for (const radio of radios) expect(radio.id).not.toBe(group.id);
    // Card labels reach their own radio; selection preserved.
    expect(screen.getByLabelText('Pro')).toBeChecked();
  });
});
