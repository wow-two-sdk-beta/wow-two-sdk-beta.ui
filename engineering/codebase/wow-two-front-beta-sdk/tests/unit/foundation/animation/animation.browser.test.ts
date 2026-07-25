import { cleanup, render, renderHook } from '@testing-library/react';
import { createElement, type ReactElement, type RefObject } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AnimatedLayout,
  animate,
  measureRect,
  playFlip,
  useFlip,
} from '@src/foundation/animation';

// Browser project (real chromium ⇒ real WAAPI + a real layout engine). This file covers only what needs a
// browser: that a handle's `finished` really settles, that cancel/finish drive a real `Animation`, that the
// reduced-motion and no-WAAPI branches commit styles instead of animating, and that a FLIP leaves the element
// with no `transform` residue once it settles. The geometry math itself is proven in `animation.test.ts`.
//
// Durations are ~10ms: long enough that the animation is genuinely running when asserted, short enough that
// awaiting it costs nothing. Nothing here sleeps on a timer — every wait is on a real animation event.

/** Absolutely positioned so its rect is independent of body margin, sibling flow, and scroll. */
function box(css: string): HTMLDivElement {
  const element = document.createElement('div');
  element.style.cssText = `position:absolute;width:50px;height:50px;${css}`;
  document.body.appendChild(element);
  return element;
}

/** Waits for every animation currently running on `element`, then for one frame so styles are recomputed. */
async function settle(element: Element): Promise<void> {
  await Promise.all(
    element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
  );
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe('animate', () => {
  it('starts a real animation and resolves finished when it ends', async () => {
    const element = box('left:0px;top:0px');

    const handle = animate(element, [{ opacity: '0' }, { opacity: '1' }], { duration: 10 });

    expect(element.getAnimations()).toHaveLength(1);
    await expect(handle.finished).resolves.toBeUndefined();
  });

  it('settles finished on cancel — resolving, never rejecting', async () => {
    const element = box('left:0px;top:0px');
    const handle = animate(element, [{ opacity: '0' }, { opacity: '1' }], { duration: 5000 });
    expect(element.getAnimations()).toHaveLength(1);

    handle.cancel();

    await expect(handle.finished).resolves.toBeUndefined();
    expect(element.getAnimations()).toHaveLength(0);
  });

  it('jumps to the end on finish()', async () => {
    const element = box('left:0px;top:0px');
    const handle = animate(element, [{ opacity: '0' }, { opacity: '1' }], {
      duration: 5000,
      fill: 'forwards',
    });

    handle.finish();
    await handle.finished;

    expect(getComputedStyle(element).opacity).toBe('1');
    handle.cancel(); // drop the forwards fill so the element is left clean
  });

  it('suspends and resumes playback', async () => {
    const element = box('left:0px;top:0px');
    const handle = animate(element, [{ opacity: '0' }, { opacity: '1' }], { duration: 5000 });

    handle.pause();
    expect(element.getAnimations().at(0)?.playState).toBe('paused');

    handle.play();
    expect(element.getAnimations().at(0)?.playState).not.toBe('paused');

    handle.cancel();
    await handle.finished;
  });

  it('commits the final frame with no animation under reduced motion', async () => {
    const element = box('left:0px;top:0px');

    const handle = animate(element, [{ opacity: '0' }, { opacity: '0.25' }], {
      duration: 5000,
      reducedMotion: true,
    });

    await expect(handle.finished).resolves.toBeUndefined();
    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.opacity).toBe('0.25');
    expect(getComputedStyle(element).opacity).toBe('0.25');
  });

  it('applies kebab-case properties on the reduced-motion path', () => {
    const element = box('left:0px;top:0px');

    animate(element, [{ 'background-color': 'rgb(1, 2, 3)' }], { reducedMotion: true });

    expect(element.style.backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('commits the final frame when the host has no WAAPI', async () => {
    const element = box('left:0px;top:0px');
    // Shadow the method on the instance to simulate a host without `element.animate` (Safari < 13.1, jsdom).
    Object.defineProperty(element, 'animate', { value: undefined, configurable: true });

    const handle = animate(element, [{ opacity: '0' }, { opacity: '0.5' }], { duration: 5000 });

    await expect(handle.finished).resolves.toBeUndefined();
    expect(element.style.opacity).toBe('0.5');
  });
});

describe('measureRect', () => {
  it('snapshots real viewport geometry', () => {
    const element = box('left:20px;top:40px;width:60px;height:80px');

    expect(measureRect(element)).toEqual({ x: 20, y: 40, width: 60, height: 80 });
  });
});

describe('playFlip', () => {
  it('animates a moved element and leaves no transform behind', async () => {
    const element = box('left:0px;top:0px');
    const first = measureRect(element);

    element.style.left = '150px';
    const handle = playFlip(element, first, { duration: 10 });

    expect(element.getAnimations()).toHaveLength(1);
    await handle.finished;
    await settle(element);

    expect(element.style.transform).toBe('');
    expect(getComputedStyle(element).transform).toBe('none');
    expect(element.getAnimations()).toHaveLength(0);
  });

  it('animates a resized element', async () => {
    const element = box('left:0px;top:0px');
    const first = measureRect(element);

    element.style.width = '200px';
    const handle = playFlip(element, first, { duration: 10 });

    expect(element.getAnimations()).toHaveLength(1);
    await handle.finished;
  });

  it('does not animate when nothing moved', async () => {
    const element = box('left:0px;top:0px');

    const handle = playFlip(element, measureRect(element), { duration: 5000 });

    expect(element.getAnimations()).toHaveLength(0);
    await expect(handle.finished).resolves.toBeUndefined();
  });

  it('leaves the element at its final position under reduced motion', async () => {
    const element = box('left:0px;top:0px');
    const first = measureRect(element);

    element.style.left = '150px';
    const handle = playFlip(element, first, { duration: 5000, reducedMotion: true });

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.transform).toBe('');
    expect(measureRect(element)?.x).toBe(150);
    await expect(handle.finished).resolves.toBeUndefined();
  });

  it('no-ops without throwing when the element or snapshot is missing', async () => {
    await expect(playFlip(null, { x: 0, y: 0, width: 1, height: 1 }).finished).resolves.toBeUndefined();
    await expect(playFlip(box(''), null).finished).resolves.toBeUndefined();
  });
});

describe('useFlip', () => {
  it('animates the element on a deps change and leaves no lingering transform', async () => {
    const element = box('left:0px;top:0px');
    const ref: RefObject<HTMLDivElement | null> = { current: element };

    const { rerender } = renderHook(({ step }) => useFlip(ref, [step], { duration: 10 }), {
      initialProps: { step: 0 },
    });

    element.style.left = '180px';
    rerender({ step: 1 });

    expect(element.getAnimations()).toHaveLength(1);
    await settle(element);

    expect(element.style.transform).toBe('');
    expect(getComputedStyle(element).transform).toBe('none');
    expect(element.getAnimations()).toHaveLength(0);
  });

  it('does not animate on the first commit — a mount is not a layout change', () => {
    const element = box('left:0px;top:0px');
    const ref: RefObject<HTMLDivElement | null> = { current: element };

    renderHook(() => useFlip(ref, [0], { duration: 5000 }));

    expect(element.getAnimations()).toHaveLength(0);
  });

  it('skips the animation under reduced motion but keeps the snapshot current', () => {
    const element = box('left:0px;top:0px');
    const ref: RefObject<HTMLDivElement | null> = { current: element };

    const { rerender } = renderHook(
      ({ step }) => useFlip(ref, [step], { duration: 5000, reducedMotion: true }),
      { initialProps: { step: 0 } },
    );

    element.style.left = '180px';
    rerender({ step: 1 });

    expect(element.getAnimations()).toHaveLength(0);
    expect(element.style.transform).toBe('');
  });

  it('does nothing when the ref is empty', () => {
    const ref: RefObject<HTMLDivElement | null> = { current: null };

    expect(() => {
      const { rerender } = renderHook(({ step }) => useFlip(ref, [step]), {
        initialProps: { step: 0 },
      });
      rerender({ step: 1 });
    }).not.toThrow();
  });
});

describe('AnimatedLayout', () => {
  /** Renders one keyed, fixed-height row per id so a reorder produces a real vertical delta. */
  function rows(ids: readonly string[]): ReactElement[] {
    return ids.map((id) => createElement('div', { key: id, style: { height: 20 } }, id));
  }

  /** The layout's wrapper element, or a thrown error if it never rendered. */
  function wrapperOf(container: HTMLElement): Element {
    const wrapper = container.firstElementChild;
    if (!wrapper) throw new Error('AnimatedLayout rendered no wrapper element');
    return wrapper;
  }

  it('tags each keyed child with its React key', () => {
    const { container } = render(createElement(AnimatedLayout, null, rows(['a', 'b'])));

    const keys = Array.from(wrapperOf(container).children).map((child) =>
      child.getAttribute('data-flip-key'),
    );

    expect(keys).toHaveLength(2);
    expect(keys.every((key) => key !== null)).toBe(true);
  });

  it('animates surviving children on a reorder and leaves no transform behind', async () => {
    const { container, rerender } = render(
      createElement(AnimatedLayout, { duration: 10 }, rows(['a', 'b', 'c'])),
    );
    const wrapper = wrapperOf(container);

    rerender(createElement(AnimatedLayout, { duration: 10 }, rows(['c', 'b', 'a'])));

    const children = Array.from(wrapper.children);
    expect(children.filter((child) => child.getAnimations().length > 0).length).toBeGreaterThan(0);

    await Promise.all(children.map((child) => settle(child)));

    for (const child of children) {
      expect(child.getAnimations()).toHaveLength(0);
      expect(getComputedStyle(child).transform).toBe('none');
    }
  });

  it('does not animate under reduced motion', () => {
    const props = { duration: 5000, reducedMotion: true };
    const { container, rerender } = render(
      createElement(AnimatedLayout, props, rows(['a', 'b', 'c'])),
    );
    const wrapper = wrapperOf(container);

    rerender(createElement(AnimatedLayout, props, rows(['c', 'b', 'a'])));

    for (const child of Array.from(wrapper.children)) {
      expect(child.getAnimations()).toHaveLength(0);
    }
  });

  it('does not animate when disabled', () => {
    const props = { duration: 5000, enabled: false };
    const { container, rerender } = render(
      createElement(AnimatedLayout, props, rows(['a', 'b', 'c'])),
    );
    const wrapper = wrapperOf(container);

    rerender(createElement(AnimatedLayout, props, rows(['c', 'b', 'a'])));

    for (const child of Array.from(wrapper.children)) {
      expect(child.getAnimations()).toHaveLength(0);
    }
  });

  it('renders without children and without throwing', () => {
    expect(() => render(createElement(AnimatedLayout, null))).not.toThrow();
  });
});
