import type { CSSProperties } from 'react';

/**
 * CSS-value extensions — types, token maps, and resolvers for the design
 * system's spacing / radius / box-size abstractions.
 *
 * Components consume these instead of duplicating their own padding/radius
 * tokens (Button, IconButton, FAB, ToggleButton, etc.).
 */

// =============================================================================
// Tokens
// =============================================================================

/** Padding preset — discrete spacing scale, decoupled from `size`. */
export type PaddingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Border-radius preset — design-system radius scale + `none` / `full`. */
export type RadiusToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Raw CSS value — number = px, string = any CSS unit (`"1rem"`, `"calc(...)"`). */
export type SizeValue = string | number;

// =============================================================================
// Token → CSS maps
// =============================================================================

export const PADDING_TOKEN_TO_CSS: Record<Exclude<PaddingToken, 'none'>, string> = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export const RADIUS_TOKEN_TO_CSS: Record<Exclude<RadiusToken, 'none' | 'full'>, string> = {
  xs: '0.125rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
};

// =============================================================================
// Resolvers — turn SDK abstractions into CSSProperties
// =============================================================================

/** Coerce a `SizeValue` to a CSS string (number → `"Npx"`, string passthrough). */
export function sizeValueToCss(v: SizeValue): string {
  return typeof v === 'number' ? `${v}px` : v;
}

/** Padding override — token preset OR per-axis object. */
export type PaddingProp = PaddingToken | { x?: SizeValue; y?: SizeValue };

export function resolvePaddingStyle(
  padding: PaddingProp | undefined,
): CSSProperties | undefined {
  if (!padding) return undefined;
  if (typeof padding === 'string') {
    if (padding === 'none') {
      return { paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 };
    }
    const v = PADDING_TOKEN_TO_CSS[padding];
    return { paddingLeft: v, paddingRight: v, paddingTop: v, paddingBottom: v };
  }
  const style: CSSProperties = {};
  if (padding.x !== undefined) {
    const v = sizeValueToCss(padding.x);
    style.paddingLeft = v;
    style.paddingRight = v;
  }
  if (padding.y !== undefined) {
    const v = sizeValueToCss(padding.y);
    style.paddingTop = v;
    style.paddingBottom = v;
  }
  return style;
}

/** Radius override — token preset OR raw CSS value. */
export type RadiusProp = RadiusToken | SizeValue;

export function resolveRadiusStyle(
  radius: RadiusProp | undefined,
): CSSProperties | undefined {
  if (radius === undefined || radius === null) return undefined;
  if (typeof radius === 'number') return { borderRadius: `${radius}px` };
  if (radius === 'none') return { borderRadius: 0 };
  if (radius === 'full') return { borderRadius: '9999px' };
  if (radius in RADIUS_TOKEN_TO_CSS) {
    return {
      borderRadius:
        RADIUS_TOKEN_TO_CSS[radius as Exclude<RadiusToken, 'none' | 'full'>],
    };
  }
  // Raw CSS unit string (e.g. "20px", "1rem")
  return { borderRadius: radius };
}

/** Box-size overrides — `width / height / minWidth / minHeight`. */
export interface BoxSizeOverrides {
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  minHeight?: SizeValue;
}

export function resolveBoxSizeStyle(
  overrides: BoxSizeOverrides,
): CSSProperties | undefined {
  const style: CSSProperties = {};
  let hasAny = false;
  if (overrides.width !== undefined) {
    style.width = sizeValueToCss(overrides.width);
    hasAny = true;
  }
  if (overrides.height !== undefined) {
    style.height = sizeValueToCss(overrides.height);
    hasAny = true;
  }
  if (overrides.minWidth !== undefined) {
    style.minWidth = sizeValueToCss(overrides.minWidth);
    hasAny = true;
  }
  if (overrides.minHeight !== undefined) {
    style.minHeight = sizeValueToCss(overrides.minHeight);
    hasAny = true;
  }
  return hasAny ? style : undefined;
}
