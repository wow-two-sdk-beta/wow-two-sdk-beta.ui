export { cn } from './cn';
// `composeRefs` / `useComposedRefs` intentionally dropped — a React-only ref-forwarding
// workaround. Vue binds template refs natively (`useTemplateRef`, function refs).
export { composeEventHandlers } from './composeEventHandlers';
export { dataAttr } from './dataAttr';
export { tv, type VariantProps } from './tv';
export type { ElementType, PolymorphicProps, PolymorphicPropsWithoutRef, PolymorphicRef } from './polymorphic';
export { CssExtensions, RadiusToken, SizePreset, AbsolutePositionPreset } from './CssExtensions';
export type {
  PaddingToken,
  SizeValue,
  PaddingProp,
  RadiusProp,
  BoxSizeOverrides,
  SizeUnion,
  AbsoluteInsetOverrides,
  AbsolutePosition,
} from './CssExtensions';
export { ColorExtensions, ColorTone } from './ColorExtensions';
export type { ColorOverride, ColorProp } from './ColorExtensions';
export { OptionalExtensions } from './OptionalExtensions';
export { PressExtensions, type PressEvent } from './PressExtensions';
export { HtmlElement, ButtonType } from './HtmlExtensions';
export { Key } from './KeyboardExtensions';
export { Environment, IS_DEV, IS_PRODUCTION } from './Environment';
export { TransitionExtensions } from './TransitionExtensions';
export type { PresenceAnimationDurationProp, PresenceAnimationDuration } from './TransitionExtensions';
export { surfaceVariants, SurfaceVariant } from './SurfaceStyles';
export type { SurfaceVariants, SurfaceTone, SurfaceRadius, SurfacePadding, SurfaceElevation } from './SurfaceStyles';
export { Layer, layerStyle, type LayerName } from './Layers';
export { Equality, type EqualityComparer } from './Equality';
export { createCollator, compareStrings } from './Compare';
export { Tone, Size, Radius, Padding } from './StyleTokens';
export type { Elevation } from './StyleTokens';
export { Tones, ToneFamily } from './Tones';

// Shared registry enums (G1) — value + type.
export { Severity } from './Severity';
export { Orientation } from './Orientation';
export { Align } from './Align';
export { Side } from './Side';
export { CornerPosition } from './CornerPosition';
export { OverlayPosition } from './OverlayPosition';
export { ProgressTone } from './ProgressTone';
export { ElementTag } from './ElementTag';
export { AriaAttribute } from './AriaAttribute';
export { AttributeValue } from './AttributeValue';
export { DomEvent, type HandlerProp } from './DomEvent';
export { StatusTone } from './StatusTone';
