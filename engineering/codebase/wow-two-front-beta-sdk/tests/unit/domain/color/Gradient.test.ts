/* ---------------------------------------------------------------------------
 * Gradient companion-ops tests.
 *
 * Contract: pure, immutable operations over the `Gradient` discriminated
 * union (linear | radial). Updates return new values without mutating the
 * input; cross-type setters (withAngle on radial, withRadius on linear) and
 * same-type withType are no-ops returning the same reference.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';

import { Gradient, type GradientStop, type LinearGradient, type RadialGradient } from '@src/domain/color/Gradient';
import { GradientType } from '@src/domain/color/GradientType';

const stops = (): GradientStop[] => [
  { color: '#ff0000', offset: 0 },
  { color: '#0000ff', offset: 1 },
];

const linear = (): LinearGradient => Gradient.linear(stops(), 90);
const radial = (): RadialGradient => Gradient.radial(stops(), 0.5);

describe('Gradient.linear / Gradient.radial', () => {
  it('linear builds the discriminated shape with the given angle', () => {
    expect(linear()).toEqual({ type: GradientType.Linear, angle: 90, stops: stops() });
  });

  it('radial builds the discriminated shape with the given radius', () => {
    expect(radial()).toEqual({ type: GradientType.Radial, radius: 0.5, stops: stops() });
  });
});

describe('Gradient.twoStop', () => {
  it('creates a two-stop linear gradient with offsets 0 and 1', () => {
    expect(Gradient.twoStop('#111111', '#eeeeee', 45)).toEqual({
      type: GradientType.Linear,
      angle: 45,
      stops: [
        { color: '#111111', offset: 0 },
        { color: '#eeeeee', offset: 1 },
      ],
    });
  });
});

describe('Gradient.withStop', () => {
  it('replaces only the addressed stop color, keeping its offset', () => {
    const result = Gradient.withStop(linear(), 1, '#00ff00');
    expect(result.stops).toEqual([
      { color: '#ff0000', offset: 0 },
      { color: '#00ff00', offset: 1 },
    ]);
  });

  it('does not mutate the input gradient', () => {
    const input = linear();
    Gradient.withStop(input, 0, '#00ff00');
    expect(input).toEqual(linear());
  });

  it('keeps untouched stop objects by reference', () => {
    const input = linear();
    const result = Gradient.withStop(input, 1, '#00ff00');
    expect(result.stops[0]).toBe(input.stops[0]);
    expect(result.stops[1]).not.toBe(input.stops[1]);
  });

  it('leaves all stops as-is for an out-of-range index', () => {
    const input = linear();
    expect(Gradient.withStop(input, 5, '#00ff00').stops).toEqual(input.stops);
  });

  it('preserves the projection fields of both variants', () => {
    expect(Gradient.withStop(linear(), 0, '#00ff00')).toMatchObject({ type: GradientType.Linear, angle: 90 });
    expect(Gradient.withStop(radial(), 0, '#00ff00')).toMatchObject({ type: GradientType.Radial, radius: 0.5 });
  });
});

describe('Gradient.reverseStops', () => {
  it('mirrors colors end-to-end while keeping each offset in place', () => {
    expect(Gradient.reverseStops(linear()).stops).toEqual([
      { color: '#0000ff', offset: 0 },
      { color: '#ff0000', offset: 1 },
    ]);
  });

  it('keeps the middle stop of an odd count on itself', () => {
    const three = Gradient.linear(
      [
        { color: '#aa0000', offset: 0 },
        { color: '#00aa00', offset: 0.5 },
        { color: '#0000aa', offset: 1 },
      ],
      0,
    );
    expect(Gradient.reverseStops(three).stops).toEqual([
      { color: '#0000aa', offset: 0 },
      { color: '#00aa00', offset: 0.5 },
      { color: '#aa0000', offset: 1 },
    ]);
  });

  it('is an involution — reversing twice restores the original', () => {
    const input = linear();
    expect(Gradient.reverseStops(Gradient.reverseStops(input))).toEqual(input);
  });

  it('does not mutate the input gradient', () => {
    const input = linear();
    Gradient.reverseStops(input);
    expect(input).toEqual(linear());
  });
});

describe('Gradient.withAngle', () => {
  it('sets the angle on a linear gradient without touching the stops', () => {
    const input = linear();
    const result = Gradient.withAngle(input, 270);
    expect(result).toEqual({ ...input, angle: 270 });
    expect(result).not.toBe(input);
  });

  it('is a no-op on a radial gradient (same reference)', () => {
    const input = radial();
    expect(Gradient.withAngle(input, 270)).toBe(input);
  });
});

describe('Gradient.withRadius', () => {
  it('sets the radius on a radial gradient without touching the stops', () => {
    const input = radial();
    const result = Gradient.withRadius(input, 0.25);
    expect(result).toEqual({ ...input, radius: 0.25 });
    expect(result).not.toBe(input);
  });

  it('is a no-op on a linear gradient (same reference)', () => {
    const input = linear();
    expect(Gradient.withRadius(input, 0.25)).toBe(input);
  });
});

describe('Gradient.withType', () => {
  const defaults = { angle: 135, radius: 0.75 };

  it('returns the same reference when already the requested type', () => {
    const line = linear();
    const circle = radial();
    expect(Gradient.withType(line, GradientType.Linear, defaults)).toBe(line);
    expect(Gradient.withType(circle, GradientType.Radial, defaults)).toBe(circle);
  });

  it('linear → radial keeps the stops (by reference), seeds radius from defaults, drops angle', () => {
    const input = linear();
    const result = Gradient.withType(input, GradientType.Radial, defaults);
    expect(result).toEqual({ type: GradientType.Radial, radius: 0.75, stops: input.stops });
    expect(result.stops).toBe(input.stops);
    expect(result).not.toHaveProperty('angle');
  });

  it('radial → linear keeps the stops (by reference), seeds angle from defaults, drops radius', () => {
    const input = radial();
    const result = Gradient.withType(input, GradientType.Linear, defaults);
    expect(result).toEqual({ type: GradientType.Linear, angle: 135, stops: input.stops });
    expect(result.stops).toBe(input.stops);
    expect(result).not.toHaveProperty('radius');
  });
});
