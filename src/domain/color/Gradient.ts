import { GradientType } from './GradientType';

/** Defines one color stop of a foreground gradient (the start / end of a two-stop fill). */
export interface GradientStop {
  /** The stop color, `#RRGGBB`. */
  color: string;
  /** The stop's position along the gradient, `0..1`. */
  offset: number;
}

/** Defines the shared gradient data — the color stops, independent of projection. */
interface GradientBase {
  /** The ordered color stops (two: start, end). */
  stops: GradientStop[];
}

/** Defines a linear (directional) gradient. */
export interface LinearGradient extends GradientBase {
  /** Discriminant — a linear projection. */
  type: typeof GradientType.Linear;
  /** Direction in degrees; `0` = left→right, `90` = top→bottom. */
  angle: number;
}

/** Defines a radial (center-out) gradient. */
export interface RadialGradient extends GradientBase {
  /** Discriminant — a radial projection. */
  type: typeof GradientType.Radial;
  /** Extent as a fraction (`0..1`) of the canvas half-size — smaller is tighter. */
  radius: number;
}

/** Defines a foreground gradient — a linear or radial projection over shared stops. */
export type Gradient = LinearGradient | RadialGradient;

/** Returns the gradient with one stop's color replaced (by index). */
function withStop(gradient: Gradient, index: number, color: string): Gradient {
  const stops = gradient.stops.map((stop, i) => (i === index ? { ...stop, color } : stop));
  return { ...gradient, stops };
}

/** Returns the gradient with its stop colors mirrored end-to-end, each offset kept — a symmetric flip for any stop count. */
function reverseStops(gradient: Gradient): Gradient {
  const last = gradient.stops.length - 1;
  const stops = gradient.stops.map((stop, i) => ({ ...stop, color: gradient.stops[last - i]!.color }));
  return { ...gradient, stops };
}

/** Returns the gradient with its linear angle set (no-op on a radial gradient). */
function withAngle(gradient: Gradient, angle: number): Gradient {
  return gradient.type === GradientType.Linear ? { ...gradient, angle } : gradient;
}

/** Returns the gradient with its radial radius set (no-op on a linear gradient). */
function withRadius(gradient: Gradient, radius: number): Gradient {
  return gradient.type === GradientType.Radial ? { ...gradient, radius } : gradient;
}

/** Operations over a `Gradient` value — the companion to the `Gradient` type. */
export const Gradient = {
  withStop,
  reverseStops,
  withAngle,
  withRadius,
};
