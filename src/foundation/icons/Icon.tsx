import { forwardRef, type ComponentType, type SVGProps } from 'react';
import { cn } from '../utils/cn';

export interface IconAdapterProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export type IconAdapter = ComponentType<IconAdapterProps>;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'aria-hidden'> {
  /** Icon component — pass a `lucide-react` icon, custom SVG component, or any matching shape. */
  icon: IconAdapter;
  /** Pixel size of the rendered SVG. Default 20. */
  size?: number | string;
  /**
   * Provide an aria-label when the icon stands alone (decorative siblings
   * should pass it via parent). Sets `role="img"` and unhides from AT.
   * Without it, the icon is `aria-hidden` and decorative.
   */
  'aria-label'?: string;
}

/**
 * Generic icon wrapper. Accepts any icon component matching the lucide-react
 * shape (`{ size, color, className, ...svgProps }`).
 *
 * - Without `aria-label` → decorative, `aria-hidden`.
 * - With `aria-label` → semantic, `role="img"`.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComp, size = 20, className, 'aria-label': ariaLabel, ...rest }, ref) => {
    const labelled = ariaLabel !== undefined;
    return (
      <IconComp
        ref={ref}
        size={size}
        className={cn('shrink-0', className)}
        aria-hidden={labelled ? undefined : true}
        aria-label={ariaLabel}
        role={labelled ? 'img' : undefined}
        focusable={false}
        {...rest}
      />
    );
  },
);
Icon.displayName = 'Icon';
