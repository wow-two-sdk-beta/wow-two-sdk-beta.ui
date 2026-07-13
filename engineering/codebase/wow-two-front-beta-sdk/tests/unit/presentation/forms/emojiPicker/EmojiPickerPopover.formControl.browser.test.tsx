import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { memoryStorageBroker } from '@src/foundation/storage';
import { Field } from '@src/presentation/forms/field/Field';
import { EmojiPickerPopover } from '@src/presentation/forms/emojiPicker/EmojiPickerPopover';

/*
 * F-2b regression — popover-trigger family: the DEFAULT trigger Button adopts
 * the FormControlContext block (id / aria-labelledby / aria-describedby /
 * aria-invalid) from a surrounding `Field`; `Button` itself inherits the
 * context's disabled flag.
 */

afterEach(cleanup);

function renderPicker(fieldProps: { error?: string; isDisabled?: boolean } = {}) {
  return (
    <Field label="Reaction" helper="Shown on your posts" {...fieldProps}>
      <EmojiPickerPopover value={null} onChange={() => {}} storage={memoryStorageBroker()} />
    </Field>
  );
}

describe('EmojiPickerPopover — FormControlContext wiring', () => {
  it('adopts id/labelledby/describedby from Field; invalid + disabled propagate', () => {
    const view = render(renderPicker());

    const trigger = screen.getByRole('button');
    const label = screen.getByText('Reaction');
    const helper = screen.getByText('Shown on your posts');
    expect(label).toHaveAttribute('for', trigger.id);
    // `aria-labelledby` wins the accessible-name computation over the built-in fallback label.
    expect(trigger).toHaveAttribute('aria-labelledby', label.id);
    expect(trigger.getAttribute('aria-describedby')).toBe(helper.id);
    expect(trigger).not.toHaveAttribute('aria-invalid');
    expect(trigger).toBeEnabled();

    view.rerender(renderPicker({ error: 'Required' }));
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);

    view.rerender(renderPicker({ isDisabled: true }));
    expect(trigger).toBeDisabled();
  });

  it('keeps the panel search input off the field id — the trigger id stays unique while open', async () => {
    render(renderPicker());

    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);
    // The panel's SearchInput reads `id ?? ctx.id` — the bare provider around the panel
    // keeps it from adopting the field id that now names the trigger.
    const search = await waitFor(() => screen.getByPlaceholderText('Search emoji…'));
    expect(search.id).not.toBe(trigger.id);
    expect(document.querySelectorAll(`[id="${trigger.id}"]`)).toHaveLength(1);
  });
});
