import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CheckboxField } from '@src/presentation/forms/checkboxField/CheckboxField';
import { Field } from '@src/presentation/forms/field/Field';

import { CheckboxGroup } from '@src/presentation/forms/checkboxGroup/CheckboxGroup';

/*
 * F-2b grouped-choices regression — group-level FormControlContext wiring.
 * The fieldset (group node) adopts the context id + labelledBy/describedBy +
 * aria-invalid; disabled/invalid cascade to the items (fieldset-disabled
 * pattern); the items keep UNIQUE ids — the context id must never leak into
 * every child (duplicate DOM ids).
 */

afterEach(cleanup);

function renderGroup(fieldProps: Partial<React.ComponentProps<typeof Field>> = {}) {
  return render(
    <Field label="Notifications" helper="Pick any" {...fieldProps}>
      <CheckboxGroup defaultValue={['email']}>
        <CheckboxField value="email" label="Email" />
        <CheckboxField value="sms" label="SMS" />
        <CheckboxField value="push" label="Push" />
      </CheckboxGroup>
    </Field>,
  );
}

describe('CheckboxGroup — FormControlContext (group wiring)', () => {
  it('the group node takes the context id + label/helper references', () => {
    renderGroup();
    const group = screen.getByRole('group', { name: 'Notifications' });
    const label = screen.getByText('Notifications');
    const helper = screen.getByText('Pick any');
    // `Label htmlFor` resolves onto the group container (labelledBy composition names it).
    expect(label).toHaveAttribute('for', group.id);
    expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    expect(group.getAttribute('aria-describedby')).toBe(helper.id);
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('items keep unique ids — the context id does not leak into the children', () => {
    renderGroup();
    const group = screen.getByRole('group', { name: 'Notifications' });
    const boxes = screen.getAllByRole('checkbox');
    const ids = boxes.map((box) => box.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    for (const box of boxes) {
      expect(box.id).not.toBe(group.id);
      // The group-level helper is referenced once, on the group node — not per item.
      expect(box).not.toHaveAttribute('aria-describedby');
    }
    // Item labels still reach their own control.
    expect(screen.getByLabelText('Email')).toBe(boxes[0]);
  });

  it('invalid lands on the group node and cascades to the items', () => {
    renderGroup({ error: 'Pick at least one' });
    const group = screen.getByRole('group', { name: 'Notifications' });
    const alert = screen.getByRole('alert');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group.getAttribute('aria-describedby')).toBe(alert.id);
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toHaveAttribute('aria-invalid', 'true');
    }
  });

  it('disabled cascades to every item (fieldset-disabled pattern)', () => {
    renderGroup({ isDisabled: true });
    expect(screen.getByRole('group', { name: 'Notifications' })).toBeDisabled();
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toBeDisabled();
    }
  });

  it('required does NOT cascade onto individual checkboxes (would demand every box checked)', () => {
    renderGroup({ isRequired: true });
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).not.toBeRequired();
    }
  });
});
