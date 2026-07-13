import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DismissableLayer } from '@src/foundation/primitives/dismissableLayer/DismissableLayer';

afterEach(cleanup);

const button = (name: string) => screen.getByRole('button', { name });

interface StackFixtureProps {
  hasInner: boolean;
  onOuterEscape: () => void;
  onInnerEscape: () => void;
  onOuterOutside: () => void;
  onInnerOutside: () => void;
}

/**
 * Models the real overlay flow: the outer layer (modal) is mounted first, the
 * inner layer (popover) is mounted in a LATER commit via rerender. Stack order
 * is registration (effect) order, so layers opened later stack on top.
 * NB: mounting both in the same commit would invert the stack (child effects
 * run before parent effects) — intentionally not pinned here.
 */
function StackFixture({
  hasInner,
  onOuterEscape,
  onInnerEscape,
  onOuterOutside,
  onInnerOutside,
}: StackFixtureProps) {
  return (
    <>
      <button type="button">outside</button>
      <DismissableLayer onEscape={onOuterEscape} onOutsidePointerDown={onOuterOutside}>
        <button type="button">outer content</button>
        {hasInner && (
          <DismissableLayer onEscape={onInnerEscape} onOutsidePointerDown={onInnerOutside}>
            <button type="button">inner content</button>
          </DismissableLayer>
        )}
      </DismissableLayer>
    </>
  );
}

function renderStack() {
  const spies = {
    onOuterEscape: vi.fn(),
    onInnerEscape: vi.fn(),
    onOuterOutside: vi.fn(),
    onInnerOutside: vi.fn(),
  };
  const view = render(<StackFixture hasInner={false} {...spies} />);
  view.rerender(<StackFixture hasInner {...spies} />);
  return { view, spies };
}

describe('DismissableLayer', () => {
  it('calls onEscape when Escape is pressed', async () => {
    const onEscape = vi.fn();
    render(
      <DismissableLayer onEscape={onEscape}>
        <button type="button">content</button>
      </DismissableLayer>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not call onEscape when isEscapeDisabled', async () => {
    const onEscape = vi.fn();
    render(
      <DismissableLayer onEscape={onEscape} isEscapeDisabled>
        <button type="button">content</button>
      </DismissableLayer>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('calls onOutsidePointerDown when a pointer goes down outside the layer', async () => {
    const onOutside = vi.fn();
    render(
      <>
        <button type="button">outside</button>
        <DismissableLayer onOutsidePointerDown={onOutside}>
          <button type="button">inside</button>
        </DismissableLayer>
      </>,
    );
    await userEvent.click(button('outside'));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('does not call onOutsidePointerDown for clicks inside the layer', async () => {
    const onOutside = vi.fn();
    render(
      <DismissableLayer onOutsidePointerDown={onOutside}>
        <button type="button">inside</button>
      </DismissableLayer>,
    );
    await userEvent.click(button('inside'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('does not call onOutsidePointerDown when isOutsideClickDisabled', async () => {
    const onOutside = vi.fn();
    render(
      <>
        <button type="button">outside</button>
        <DismissableLayer onOutsidePointerDown={onOutside} isOutsideClickDisabled>
          <button type="button">inside</button>
        </DismissableLayer>
      </>,
    );
    await userEvent.click(button('outside'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('uses the latest onEscape callback without re-registering (stack order preserved)', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(
      <DismissableLayer onEscape={first}>
        <button type="button">content</button>
      </DismissableLayer>,
    );
    view.rerender(
      <DismissableLayer onEscape={second}>
        <button type="button">content</button>
      </DismissableLayer>,
    );
    await userEvent.keyboard('{Escape}');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('Escape only dismisses the topmost layer of a stack', async () => {
    const { spies } = renderStack();
    await userEvent.keyboard('{Escape}');
    expect(spies.onInnerEscape).toHaveBeenCalledTimes(1);
    expect(spies.onOuterEscape).not.toHaveBeenCalled();
  });

  it('outside pointer-down only dismisses the topmost layer of a stack', async () => {
    const { spies } = renderStack();

    // Outside both layers → only the topmost (inner) reacts.
    await userEvent.click(button('outside'));
    expect(spies.onInnerOutside).toHaveBeenCalledTimes(1);
    expect(spies.onOuterOutside).not.toHaveBeenCalled();

    // On the outer layer (inside outer, outside inner) → still "outside" for
    // the topmost layer: the inner layer reacts, the outer never does.
    await userEvent.click(button('outer content'));
    expect(spies.onInnerOutside).toHaveBeenCalledTimes(2);
    expect(spies.onOuterOutside).not.toHaveBeenCalled();
  });

  it('promotes the next layer to topmost when the top layer unmounts', async () => {
    const { view, spies } = renderStack();
    view.rerender(<StackFixture hasInner={false} {...spies} />);
    await userEvent.keyboard('{Escape}');
    expect(spies.onOuterEscape).toHaveBeenCalledTimes(1);
    expect(spies.onInnerEscape).not.toHaveBeenCalled();
  });
});
