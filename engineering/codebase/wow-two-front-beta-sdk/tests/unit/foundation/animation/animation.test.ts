import { describe, expect, it } from 'vitest';

import {
  ANIMATION_DEFAULTS,
  IDENTITY_FLIP_TRANSFORM,
  animate,
  applyFinalKeyframe,
  computeFlipTransform,
  formatFlipTransform,
  isIdentityFlip,
  measureRect,
  noopAnimationHandle,
  type RectLike,
} from '@src/foundation/animation';

// Node project — everything here is pure. `computeFlipTransform` is the entire FLIP algorithm expressed over
// two plain rects, so it is exercised with hand-built objects: no layout engine, no browser, no flake. The DOM
// shell (`playFlip`, `useFlip`, `AnimatedLayout`) lives in `animation.browser.test.ts`.

/** Builds a rect snapshot; every field defaults to 0 so a case only states what it is about. */
function rect(partial: Partial<RectLike> = {}): RectLike {
  return { x: 0, y: 0, width: 0, height: 0, ...partial };
}

/** A minimal element double whose only capability is inline style writes, for `applyFinalKeyframe`. */
function styledElement() {
  const properties: Record<string, string> = {};
  const style = {
    setProperty(property: string, value: string) {
      properties[property] = value;
    },
  };
  return {
    element: { style } as unknown as Element,
    /** Camel-case writes land on the declaration itself; kebab/custom names go through `setProperty`. */
    read: (property: string): string | undefined =>
      properties[property] ?? (style as unknown as Record<string, string | undefined>)[property],
  };
}

/** Asserts every component of a transform is a real number — the guard against `Infinity`/`NaN` leaking to CSS. */
function expectFinite(transform: ReturnType<typeof computeFlipTransform>): void {
  expect(Number.isFinite(transform.translateX)).toBe(true);
  expect(Number.isFinite(transform.translateY)).toBe(true);
  expect(Number.isFinite(transform.scaleX)).toBe(true);
  expect(Number.isFinite(transform.scaleY)).toBe(true);
}

describe('computeFlipTransform', () => {
  it('returns identity when the rects are the same', () => {
    const same = rect({ x: 10, y: 20, width: 30, height: 40 });

    expect(computeFlipTransform(same, same)).toEqual(IDENTITY_FLIP_TRANSFORM);
  });

  it('translates without scaling for a pure position change', () => {
    const first = rect({ x: 0, y: 0, width: 100, height: 50 });
    const last = rect({ x: 30, y: 70, width: 100, height: 50 });

    expect(computeFlipTransform(first, last)).toEqual({
      translateX: -30, // element moved right → invert pulls it back left
      translateY: -70,
      scaleX: 1,
      scaleY: 1,
    });
  });

  it('translates positively when the element moved up and left', () => {
    const first = rect({ x: 200, y: 120, width: 10, height: 10 });
    const last = rect({ x: 50, y: 20, width: 10, height: 10 });

    const transform = computeFlipTransform(first, last);

    expect(transform.translateX).toBe(150);
    expect(transform.translateY).toBe(100);
  });

  it('scales without translating for a pure size change', () => {
    const first = rect({ width: 100, height: 40 });
    const last = rect({ width: 200, height: 10 });

    expect(computeFlipTransform(first, last)).toEqual({
      translateX: 0,
      translateY: 0,
      scaleX: 0.5, // was half as wide as it now is
      scaleY: 4,
    });
  });

  it('combines translate and scale when both change', () => {
    const first = rect({ x: 10, y: 10, width: 100, height: 100 });
    const last = rect({ x: 60, y: 110, width: 50, height: 400 });

    expect(computeFlipTransform(first, last)).toEqual({
      translateX: -50,
      translateY: -100,
      scaleX: 2,
      scaleY: 0.25,
    });
  });

  it('keeps sub-pixel geometry rather than rounding it away', () => {
    const first = rect({ x: 0.5, y: 0.25, width: 10, height: 10 });
    const last = rect({ x: 1, y: 1, width: 10, height: 10 });

    const transform = computeFlipTransform(first, last);

    expect(transform.translateX).toBeCloseTo(-0.5, 10);
    expect(transform.translateY).toBeCloseTo(-0.75, 10);
  });

  it('falls back to scale 1 when the last rect has zero size — never Infinity', () => {
    const first = rect({ width: 100, height: 80 });
    const last = rect({ width: 0, height: 0 });

    const transform = computeFlipTransform(first, last);

    expectFinite(transform);
    expect(transform.scaleX).toBe(1);
    expect(transform.scaleY).toBe(1);
  });

  it('guards each axis independently when only one dimension collapses', () => {
    const first = rect({ width: 100, height: 80 });
    const last = rect({ width: 50, height: 0 });

    const transform = computeFlipTransform(first, last);

    expectFinite(transform);
    expect(transform.scaleX).toBe(2);
    expect(transform.scaleY).toBe(1);
  });

  it('returns identity scale when both rects have zero size — never NaN', () => {
    const transform = computeFlipTransform(rect(), rect());

    expectFinite(transform);
    expect(transform).toEqual(IDENTITY_FLIP_TRANSFORM);
  });

  it('scales from zero when the element grew out of nothing', () => {
    const first = rect({ width: 0, height: 0 });
    const last = rect({ width: 100, height: 100 });

    const transform = computeFlipTransform(first, last);

    expectFinite(transform);
    expect(transform.scaleX).toBe(0);
    expect(transform.scaleY).toBe(0);
  });

  it('falls back to identity components for NaN inputs', () => {
    const first = rect({ x: Number.NaN, y: 0, width: Number.NaN, height: 10 });
    const last = rect({ x: 0, y: 0, width: 10, height: 10 });

    const transform = computeFlipTransform(first, last);

    expectFinite(transform);
    expect(transform.translateX).toBe(0);
    expect(transform.scaleX).toBe(1);
    expect(transform.scaleY).toBe(1);
  });

  it('falls back to identity components for Infinity inputs', () => {
    const first = rect({ x: Number.POSITIVE_INFINITY, width: 10, height: 10 });
    const last = rect({ x: 0, width: Number.POSITIVE_INFINITY, height: 10 });

    const transform = computeFlipTransform(first, last);

    expectFinite(transform);
    expect(transform.translateX).toBe(0);
    expect(transform.scaleX).toBe(1);
  });
});

describe('isIdentityFlip', () => {
  it('accepts the identity transform', () => {
    expect(isIdentityFlip(IDENTITY_FLIP_TRANSFORM)).toBe(true);
  });

  it('treats sub-pixel layout noise as identity', () => {
    expect(
      isIdentityFlip({ translateX: 0.001, translateY: -0.002, scaleX: 1.0001, scaleY: 0.9999 }),
    ).toBe(true);
  });

  it('rejects a visible translate', () => {
    expect(isIdentityFlip({ ...IDENTITY_FLIP_TRANSFORM, translateX: 1 })).toBe(false);
    expect(isIdentityFlip({ ...IDENTITY_FLIP_TRANSFORM, translateY: -1 })).toBe(false);
  });

  it('rejects a visible scale', () => {
    expect(isIdentityFlip({ ...IDENTITY_FLIP_TRANSFORM, scaleX: 1.5 })).toBe(false);
    expect(isIdentityFlip({ ...IDENTITY_FLIP_TRANSFORM, scaleY: 0.5 })).toBe(false);
  });

  it('honours a custom epsilon', () => {
    const nearly = { ...IDENTITY_FLIP_TRANSFORM, translateX: 0.5 };

    expect(isIdentityFlip(nearly)).toBe(false);
    expect(isIdentityFlip(nearly, 1)).toBe(true);
  });
});

describe('formatFlipTransform', () => {
  it('emits translate before scale so the scale pivots at transform-origin', () => {
    expect(
      formatFlipTransform({ translateX: -30, translateY: 12, scaleX: 0.5, scaleY: 2 }),
    ).toBe('translate(-30px, 12px) scale(0.5, 2)');
  });

  it('emits an explicit no-op for the identity transform', () => {
    expect(formatFlipTransform(IDENTITY_FLIP_TRANSFORM)).toBe('translate(0px, 0px) scale(1, 1)');
  });
});

describe('measureRect', () => {
  it('returns null for a missing element', () => {
    expect(measureRect(null)).toBeNull();
    expect(measureRect(undefined)).toBeNull();
  });

  it('returns null for a node that cannot be measured', () => {
    expect(measureRect({} as Element)).toBeNull();
  });

  it('snapshots left/top/width/height as a plain object', () => {
    const element = {
      getBoundingClientRect: () => ({ left: 5, top: 7, width: 11, height: 13 }),
    } as unknown as Element;

    expect(measureRect(element)).toEqual({ x: 5, y: 7, width: 11, height: 13 });
  });
});

describe('applyFinalKeyframe', () => {
  it('commits the last frame of a keyframe list', () => {
    const { element, read } = styledElement();

    applyFinalKeyframe(element, [{ opacity: '0' }, { opacity: '0.5' }, { opacity: '1' }]);

    expect(read('opacity')).toBe('1');
  });

  it('commits the last value of each property-indexed entry', () => {
    const { element, read } = styledElement();

    applyFinalKeyframe(element, { opacity: ['0', '1'], transform: ['none', 'scale(2)'] });

    expect(read('opacity')).toBe('1');
    expect(read('transform')).toBe('scale(2)');
  });

  it('accepts a single (non-array) property-indexed value', () => {
    const { element, read } = styledElement();

    applyFinalKeyframe(element, { opacity: '0.25' });

    expect(read('opacity')).toBe('0.25');
  });

  it('routes kebab-case and custom properties through setProperty', () => {
    const { element, read } = styledElement();

    applyFinalKeyframe(element, [{ 'background-color': 'red', '--ring': '2px' }]);

    expect(read('background-color')).toBe('red');
    expect(read('--ring')).toBe('2px');
  });

  it('skips frame-config keys and null values', () => {
    const { element, read } = styledElement();

    applyFinalKeyframe(element, [{ opacity: '1', offset: 1, easing: 'linear', transform: null }]);

    expect(read('opacity')).toBe('1');
    expect(read('offset')).toBeUndefined();
    expect(read('easing')).toBeUndefined();
    expect(read('transform')).toBeUndefined();
  });

  it('does nothing for an empty keyframe list', () => {
    const { element, read } = styledElement();

    expect(() => applyFinalKeyframe(element, [])).not.toThrow();
    expect(read('opacity')).toBeUndefined();
  });

  it('does nothing for a node without inline styles', () => {
    expect(() => applyFinalKeyframe({} as Element, [{ opacity: '1' }])).not.toThrow();
  });
});

describe('animate (no-DOM paths)', () => {
  it('returns a settled handle for a missing element instead of throwing', async () => {
    const handle = animate(null, [{ opacity: '1' }], { duration: 10 });

    await expect(handle.finished).resolves.toBeUndefined();
    expect(() => {
      handle.cancel();
      handle.finish();
      handle.pause();
      handle.play();
    }).not.toThrow();
  });

  it('commits the final frame instead of animating when reduced motion is on', async () => {
    const { element, read } = styledElement();

    const handle = animate(element, [{ opacity: '0' }, { opacity: '1' }], {
      duration: 10,
      reducedMotion: true,
    });

    await expect(handle.finished).resolves.toBeUndefined();
    expect(read('opacity')).toBe('1');
  });

  it('treats a zero duration as the same instant-commit path', async () => {
    const { element, read } = styledElement();

    await animate(element, [{ opacity: '0' }, { opacity: '1' }], { duration: 0 }).finished;

    expect(read('opacity')).toBe('1');
  });
});

describe('noopAnimationHandle', () => {
  it('is inert and already settled', async () => {
    const handle = noopAnimationHandle();

    await expect(handle.finished).resolves.toBeUndefined();
    expect(() => handle.cancel()).not.toThrow();
  });
});

describe('ANIMATION_DEFAULTS', () => {
  it('reuses the codebase-wide 200ms transition default', () => {
    expect(ANIMATION_DEFAULTS.duration).toBe(200);
  });

  it('declares an ease-out curve', () => {
    expect(ANIMATION_DEFAULTS.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });
});
