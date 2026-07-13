import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { FocusScope } from '@src/foundation/primitives/focusScope/FocusScope';

afterEach(cleanup);

const button = (name: string) => screen.getByRole('button', { name });
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('FocusScope', () => {
  it('moves focus to the first tabbable element on mount', async () => {
    render(
      <FocusScope loop trapped>
        <button type="button">first</button>
        <button type="button">second</button>
      </FocusScope>,
    );
    await waitFor(() => expect(button('first')).toHaveFocus());
  });

  it('wraps Tab from the last tabbable back to the first (loop)', async () => {
    render(
      <FocusScope loop trapped>
        <button type="button">first</button>
        <button type="button">second</button>
        <button type="button">last</button>
      </FocusScope>,
    );
    button('last').focus();
    await userEvent.tab();
    await waitFor(() => expect(button('first')).toHaveFocus());
  });

  it('wraps Shift+Tab from the first tabbable back to the last (loop)', async () => {
    render(
      <FocusScope loop trapped>
        <button type="button">first</button>
        <button type="button">second</button>
        <button type="button">last</button>
      </FocusScope>,
    );
    button('first').focus();
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(button('last')).toHaveFocus());
  });

  it('restores focus to the previously focused element on unmount', async () => {
    function Fixture() {
      const [isOpen, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            open
          </button>
          {isOpen && (
            <FocusScope loop trapped>
              <button type="button" onClick={() => setOpen(false)}>
                close
              </button>
            </FocusScope>
          )}
        </>
      );
    }
    render(<Fixture />);
    await userEvent.click(button('open'));
    await waitFor(() => expect(button('close')).toHaveFocus());
    await userEvent.click(button('close'));
    // Restore is deferred: Radix runs it in a setTimeout(0) after unmount.
    await waitFor(() => expect(button('open')).toHaveFocus());
  });

  it('pulls focus back inside when it is forced outside a trapped scope', async () => {
    render(
      <>
        <button type="button">outside</button>
        <FocusScope trapped>
          <button type="button">inside</button>
        </FocusScope>
      </>,
    );
    await waitFor(() => expect(button('inside')).toHaveFocus());
    button('outside').focus();
    await waitFor(() => expect(button('inside')).toHaveFocus());
  });

  it('is not trapped by default — focus may leave the scope', async () => {
    // Doc drift pin: the wrapper's JSDoc says "trapped (default true while
    // mounted)", but the re-exported Radix implementation defaults to
    // trapped={false}. This pins the ACTUAL default; if the wrapper ever
    // changes to match its doc, this test should fail loudly.
    render(
      <>
        <button type="button">outside</button>
        <FocusScope>
          <button type="button">inside</button>
        </FocusScope>
      </>,
    );
    await waitFor(() => expect(button('inside')).toHaveFocus());
    button('outside').focus();
    await sleep(50);
    expect(button('outside')).toHaveFocus();
  });
});
