import type { CSSProperties } from 'react';

/** CSS-value extensions — types, token maps, resolvers. Call as `CssExtensions.x(...)`. */

// =============================================================================
// Tokens (types — individually exported; types are erased, no shaking concern)
// =============================================================================

export type PaddingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type RadiusToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type SizeValue = string | number;
export type PaddingProp = PaddingToken | { x?: SizeValue; y?: SizeValue };
export type RadiusProp = RadiusToken | SizeValue;
export interface BoxSizeOverrides {
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  minHeight?: SizeValue;
}

// =============================================================================
// Token → CSS maps
// =============================================================================

const PADDING_TOKEN_TO_CSS: Record<Exclude<PaddingToken, 'none'>, string> = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

const RADIUS_TOKEN_TO_CSS: Record<Exclude<RadiusToken, 'none' | 'full'>, string> = {
  xs: '0.125rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
};

// =============================================================================
// Internal resolvers
// =============================================================================

function toCss(v: SizeValue): string {
  return typeof v === 'number' ? `${v}px` : v;
}

function resolvePadding(padding: PaddingProp | undefined): CSSProperties | undefined {
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
    const v = toCss(padding.x);
    style.paddingLeft = v;
    style.paddingRight = v;
  }
  if (padding.y !== undefined) {
    const v = toCss(padding.y);
    style.paddingTop = v;
    style.paddingBottom = v;
  }
  return style;
}

function resolveRadius(radius: RadiusProp | undefined): CSSProperties | undefined {
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
  return { borderRadius: radius };
}

function resolveBoxSize(overrides: BoxSizeOverrides): CSSProperties | undefined {
  const style: CSSProperties = {};
  let hasAny = false;
  if (overrides.width !== undefined) {
    style.width = toCss(overrides.width);
    hasAny = true;
  }
  if (overrides.height !== undefined) {
    style.height = toCss(overrides.height);
    hasAny = true;
  }
  if (overrides.minWidth !== undefined) {
    style.minWidth = toCss(overrides.minWidth);
    hasAny = true;
  }
  if (overrides.minHeight !== undefined) {
    style.minHeight = toCss(overrides.minHeight);
    hasAny = true;
  }
  return hasAny ? style : undefined;
}

// =============================================================================
// Grouped namespace export
// =============================================================================

export const CssExtensions = {
  toCss,
  resolvePadding,
  resolveRadius,
  resolveBoxSize,
  PADDING_TOKEN_TO_CSS,
  RADIUS_TOKEN_TO_CSS,
} as const;
