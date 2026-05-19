import {
  forwardRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { avatarVariants, type AvatarVariants } from './Avatar.variants';

const COMPONENT_NAME = 'Avatar';

/* Soft-tinted palette for autoColor — 17 distinct hues, dark-mode aware. */
const AUTO_COLOR_PALETTE = [
  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-200',
  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickAutoColor(name: string): string {
  return AUTO_COLOR_PALETTE[hashName(name) % AUTO_COLOR_PALETTE.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export interface AvatarProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    AvatarVariants {
  /* Image source. Falls back to `name` initials or `fallback` on error. */
  src?: string;

  /* Person/entity name — used to derive initials when no image. */
  name?: string;

  /* Custom fallback (overrides initials). */
  fallback?: ReactNode;

  /* Alt text for the underlying `<img>`. Defaults to `name`. */
  alt?: string;

  /* When true (and no explicit non-neutral `tone` / non-solid `bgStyle`), derive a deterministic soft-color tint from `name` hash → 17-color palette. */
  autoColor?: boolean;
}

/* Image avatar with initials fallback. Supports semantic tones, deterministic auto-color from name hash, gradient bg, ring, and loading skeleton. Composable with `<BadgeOverlay>` for status dots / counts / icons. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      src,
      name = '',
      fallback,
      alt,
      autoColor,
      tone,
      bgStyle,
      ring,
      isLoading,
      size,
      shape,
      className,
      ...props
    },
    ref,
  ) => {
    const [errored, setErrored] = useState(false);
    const showImage = !!src && !errored && !isLoading;

    /* autoColor only fires when (a) name is set, (b) no explicit non-neutral tone, (c) bgStyle isn't gradient. Explicit dials win. */
    const autoColorClass =
      autoColor &&
      name &&
      bgStyle !== 'gradient' &&
      (tone === undefined || tone === 'neutral')
        ? pickAutoColor(name)
        : undefined;

    return (
      <span
        ref={ref}
        className={cn(
          avatarVariants({ size, shape, tone, bgStyle, ring, isLoading }),
          autoColorClass,
          className,
        )}
        data-loading={isLoading ? 'true' : undefined}
        aria-busy={isLoading ? true : undefined}
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

Avatar.displayName = COMPONENT_NAME;
