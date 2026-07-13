import type { ReactNode } from 'react';
import { useLocaleFormatters } from './LocaleFormatters';

/** Props for {@link FormattedRelative}. */
export interface FormattedRelativeProps {
  /** Signed magnitude — negative = past (`-3` → "3 days ago"), positive = future. */
  value: number;
  unit: Intl.RelativeTimeFormatUnit;
  options?: Intl.RelativeTimeFormatOptions;
}

/** Renders a locale-formatted relative time (e.g. "3 days ago") via `Intl.RelativeTimeFormat`. */
export function FormattedRelative({ value, unit, options }: FormattedRelativeProps): ReactNode {
  const { relativeTime } = useLocaleFormatters();
  return relativeTime(value, unit, options);
}
