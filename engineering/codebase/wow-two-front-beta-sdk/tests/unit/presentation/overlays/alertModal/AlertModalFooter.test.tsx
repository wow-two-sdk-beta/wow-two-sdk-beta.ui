import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertModal } from '@src/presentation/overlays/alertModal/AlertModal';

afterEach(cleanup);

/*
 * The bug: `AlertModal.Action` / `AlertModal.Cancel` rendered through the corner close button, so they inherited
 * its `absolute right-4 top-4 w-7` styles and stacked on top of each other in the header's corner.
 */
describe('AlertModal — footer actions', () => {
  function renderOpen(onAction = vi.fn(), onOpenChange = vi.fn()) {
    render(
      <AlertModal open onOpenChange={onOpenChange}>
        <AlertModal.Content>
          <AlertModal.Header>
            <AlertModal.Title>Delete item?</AlertModal.Title>
          </AlertModal.Header>
          <AlertModal.Footer>
            <AlertModal.Cancel>Cancel</AlertModal.Cancel>
            <AlertModal.Action onAction={onAction}>Delete</AlertModal.Action>
          </AlertModal.Footer>
        </AlertModal.Content>
      </AlertModal>,
    );
    return { onAction, onOpenChange };
  }

  it('renders both buttons as footer buttons, not as the corner close icon', () => {
    renderOpen();
    for (const name of ['Cancel', 'Delete']) {
      const button = screen.getByRole('button', { name });
      expect(button.className).not.toMatch(/\babsolute\b/);
      expect(button.className).toMatch(/\binline-flex\b/);
    }
  });

  it('fires the action and then closes', () => {
    const { onAction, onOpenChange } = renderOpen();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on cancel without firing the action', () => {
    const { onAction, onOpenChange } = renderOpen();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onAction).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
