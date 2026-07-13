import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Presence } from '@src/foundation/primitives/presence/Presence';

afterEach(cleanup);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/*
 * Timing semantics under test (see Presence.tsx):
 * - Enter: child mounts with data-state="closed", flips to "open" after a
 *   double requestAnimationFrame.
 * - Exit: data-state flips to "closed" synchronously; Presence then waits two
 *   animation frames to detect whether an exit animation/transition started.
 *   No animation → unmount at the end of that window (deferred, NOT
 *   synchronous). Animation → unmount on the child's own animationend /
 *   transitionend (or a computed-duration + 100 ms safety timeout).
 */

const fadeOutCss = `
@keyframes presence-test-fade { from { opacity: 1; } to { opacity: 0; } }
[data-testid='animated'][data-state='closed'] { animation: presence-test-fade 120ms linear forwards; }
`;

function Animated({ isPresent }: { isPresent: boolean }) {
  return (
    <>
      <style>{fadeOutCss}</style>
      <Presence isPresent={isPresent}>
        <div data-testid="animated">content</div>
      </Presence>
    </>
  );
}

const transitionCss = `
[data-testid='transitioned'] { transition: opacity 120ms linear; }
[data-testid='transitioned'][data-state='open'] { opacity: 1; }
[data-testid='transitioned'][data-state='closed'] { opacity: 0; }
`;

function Transitioned({ isPresent }: { isPresent: boolean }) {
  return (
    <>
      <style>{transitionCss}</style>
      <Presence isPresent={isPresent}>
        <div data-testid="transitioned">content</div>
      </Presence>
    </>
  );
}

const infiniteCss = `
@keyframes presence-test-pulse { from { opacity: 1; } to { opacity: 0; } }
[data-testid='infinite'][data-state='closed'] { animation: presence-test-pulse 80ms linear infinite; }
`;

function Infinite({ isPresent }: { isPresent: boolean }) {
  return (
    <>
      <style>{infiniteCss}</style>
      <Presence isPresent={isPresent}>
        <div data-testid="infinite">content</div>
      </Presence>
    </>
  );
}

function Static({ isPresent }: { isPresent: boolean }) {
  return (
    <Presence isPresent={isPresent}>
      <div data-testid="static">content</div>
    </Presence>
  );
}

describe('Presence', () => {
  it('renders nothing when isPresent is false on first mount', () => {
    render(<Static isPresent={false} />);
    expect(screen.queryByTestId('static')).not.toBeInTheDocument();
  });

  it('mounts the child with data-state="closed" and flips to "open" on the next frames', async () => {
    render(<Static isPresent />);
    const node = screen.getByTestId('static');
    expect(node).toHaveAttribute('data-state', 'closed');
    await waitFor(() => expect(node).toHaveAttribute('data-state', 'open'));
  });

  it('unmounts within the frame-detection window when there is no exit animation (deferred, not synchronous)', async () => {
    const view = render(<Static isPresent />);
    await waitFor(() => expect(screen.getByTestId('static')).toHaveAttribute('data-state', 'open'));

    view.rerender(<Static isPresent={false} />);
    // Still mounted right after the toggle: unmount waits for the two-frame
    // animation-start detection window even without any animation.
    expect(screen.getByTestId('static')).toBeInTheDocument();
    expect(screen.getByTestId('static')).toHaveAttribute('data-state', 'closed');

    await waitFor(() => expect(screen.queryByTestId('static')).not.toBeInTheDocument());
  });

  it('keeps the child mounted during an exit animation and unmounts after animationend', async () => {
    const view = render(<Animated isPresent />);
    await waitFor(() =>
      expect(screen.getByTestId('animated')).toHaveAttribute('data-state', 'open'),
    );

    view.rerender(<Animated isPresent={false} />);
    expect(screen.getByTestId('animated')).toHaveAttribute('data-state', 'closed');

    // Mid-animation (120 ms total) the child must still be in the DOM.
    await sleep(40);
    expect(screen.getByTestId('animated')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('animated')).not.toBeInTheDocument());
  });

  it('keeps the child mounted during an exit transition and unmounts after transitionend', async () => {
    const view = render(<Transitioned isPresent />);
    const node = screen.getByTestId('transitioned');
    await waitFor(() => expect(node).toHaveAttribute('data-state', 'open'));
    // Let the enter transition settle so the exit starts from a steady state.
    await waitFor(() => expect(getComputedStyle(node).opacity).toBe('1'));

    view.rerender(<Transitioned isPresent={false} />);
    await sleep(40);
    expect(screen.getByTestId('transitioned')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByTestId('transitioned')).not.toBeInTheDocument());
  });

  it('keeps the same node mounted when isPresent flips back to true during the exit', async () => {
    const view = render(<Animated isPresent />);
    const node = screen.getByTestId('animated');
    await waitFor(() => expect(node).toHaveAttribute('data-state', 'open'));

    view.rerender(<Animated isPresent={false} />);
    expect(node).toHaveAttribute('data-state', 'closed');

    view.rerender(<Animated isPresent />);
    await waitFor(() => expect(node).toHaveAttribute('data-state', 'open'));
    // Same element instance — the child was never unmounted.
    expect(screen.getByTestId('animated')).toBe(node);

    // And no stale exit timer unmounts it after the would-be animation end.
    await sleep(250);
    expect(screen.getByTestId('animated')).toBe(node);
  });

  it('falls back to the computed duration when the exit animation never ends (infinite)', async () => {
    const view = render(<Infinite isPresent />);
    await waitFor(() =>
      expect(screen.getByTestId('infinite')).toHaveAttribute('data-state', 'open'),
    );

    view.rerender(<Infinite isPresent={false} />);
    // animationend never fires for an infinite animation; the child stays
    // mounted while it runs…
    await sleep(40);
    expect(screen.getByTestId('infinite')).toBeInTheDocument();

    // …and the safety timeout (computed duration 80 ms + 100 ms) unmounts it.
    await waitFor(() => expect(screen.queryByTestId('infinite')).not.toBeInTheDocument(), {
      timeout: 2000,
    });
  });
});
