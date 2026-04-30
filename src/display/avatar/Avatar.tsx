import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { avatarVariants, type AvatarVariants } from './Avatar.variants';

export interface AvatarProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    AvatarVariants {
  /** Image source. Falls back to `name` initials or `fallback` on error. */
  src?: string;
  /** Person/entity name — used to derive initials when no image. */
  name?: string;
  /** Custom fallback (overrides initials). */
  fallback?: ReactNode;
  /** Alt text for the underlying `<img>`. Defaults to `name`. */
  alt?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

/**
 * Image avatar with initials fallback. Strict atom — fallback is rendered
 * inline (raw text), not via the `Text` atom, to keep this self-contained.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name = '', fallback, alt, className, size, shape, ...props }, ref) => {
    const [errored, setErrored] = useState(false);
    const showImage = src && !errored;
    return (
      <span
        ref={ref}
        className={cn(avatarVariants({ size, shape }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? name}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          fallback ?? getInitials(name)
        )}
      </span>
    );
  },
);
Avatar.displayName = 'Avatar';
