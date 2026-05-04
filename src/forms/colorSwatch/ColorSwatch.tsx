import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import { colorSwatchVariants, type ColorSwatchVariants } from './ColorSwatch.variants';

type CommonProps = Omit<ColorSwatchVariants, 'interactive'> & {
  /** Any CSS color string. Default `#000000`. */
  color?: string;
  className?: string;
};

export type ColorSwatchProps =
  | (CommonProps & {
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
      'aria-label'?: string;
    } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'color'>)
  | (CommonProps &
      Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'color'> & {
        onClick?: undefined;
      });

/**
 * Color preview chip. Renders as a `<button>` if `onClick` is provided,
 * otherwise a non-interactive `<div>`. The transparent checkerboard backdrop
 * ensures partial-alpha colors render correctly.
 */
export const ColorSwatch = forwardRef<HTMLElement, ColorSwatchProps>(function ColorSwatch(
  { color = '#000000', size, shape, selected, disabled, className, onClick, style, ...rest },
  ref,
) {
  const interactive = !!onClick;
  const classes = cn(
    colorSwatchVariants({ size, shape, interactive, selected, disabled }),
    className,
  );
  // Layer the color on top of the checkerboard via box-shadow inset — keeps
  // the variant class's `bg-[image:...]` checkerboard visible behind alpha.
  const styleWithColor: React.CSSProperties = {
    ...style,
    boxShadow: `inset 0 0 0 100px ${color}`,
  };

  if (interactive) {
    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={styleWithColor}
        className={classes}
        {...buttonProps}
      />
    );
  }
  const divProps = rest as HTMLAttributes<HTMLDivElement>;
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      style={styleWithColor}
      className={classes}
      {...divProps}
    />
  );
});
