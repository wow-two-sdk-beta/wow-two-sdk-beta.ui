import { forwardRef, useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface ImageProps extends ComponentPropsWithoutRef<'img'> {
  /** Element rendered when the image fails to load. */
  fallback?: ReactNode;
}

/**
 * Image with built-in error fallback. The fallback element replaces the
 * `<img>` on error (broken `src`, network failure). For aspect-locked
 * images, wrap in `AspectRatio`.
 */
export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ fallback, onError, alt = '', className, ...props }, ref) => {
    const [errored, setErrored] = useState(false);

    /* A new src deserves a fresh load attempt — reset the error latch. */
    useEffect(() => {
      setErrored(false);
    }, [props.src]);

    if (errored && fallback !== undefined) return <>{fallback}</>;
    return (
      <img
        ref={ref}
        alt={alt}
        className={cn('block max-w-full', className)}
        onError={(e) => {
          setErrored(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  },
);
Image.displayName = 'Image';
