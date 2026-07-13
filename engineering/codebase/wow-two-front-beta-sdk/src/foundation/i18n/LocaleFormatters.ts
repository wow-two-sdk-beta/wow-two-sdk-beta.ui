import { useMemo } from 'react';
import { useLocale } from './LocaleContext';

// `Intl` instances are cached across renders + components by locale + options — constructing them is
// the expensive part, so a shared module cache keeps `useLocaleFormatters` allocation-free after warm-up.
const intlCache = new Map<string, unknown>();
function memo<T>(cacheKey: string, make: () => T): T {
  let instance = intlCache.get(cacheKey) as T | undefined;
  if (instance === undefined) {
    instance = make();
    intlCache.set(cacheKey, instance);
  }
  return instance;
}
const optKey = (options: object | undefined): string => (options ? JSON.stringify(options) : '');

/** Locale-bound `Intl` formatters — the surface every embedded-text component formats through. */
export interface LocaleFormatters {
  /** The BCP-47 locale these formatters are bound to. */
  locale: string;
  number(value: number, options?: Intl.NumberFormatOptions): string;
  currency(value: number, currency: string, options?: Intl.NumberFormatOptions): string;
  percent(value: number, options?: Intl.NumberFormatOptions): string;
  date(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  time(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  relativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions): string;
  list(items: Iterable<string>, options?: Intl.ListFormatOptions): string;
  plural(value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule;
}

/** Builds locale-bound formatters (pure — the testable core of `useLocaleFormatters`). */
export function createLocaleFormatters(locale: string): LocaleFormatters {
  const nf = (options?: Intl.NumberFormatOptions) =>
    memo(`n|${locale}|${optKey(options)}`, () => new Intl.NumberFormat(locale, options));
  const dtf = (options?: Intl.DateTimeFormatOptions) =>
    memo(`d|${locale}|${optKey(options)}`, () => new Intl.DateTimeFormat(locale, options));
  return {
    locale,
    number: (value, options) => nf(options).format(value),
    currency: (value, currency, options) => nf({ ...options, style: 'currency', currency }).format(value),
    percent: (value, options) => nf({ ...options, style: 'percent' }).format(value),
    date: (value, options) => dtf(options ?? { dateStyle: 'medium' }).format(value),
    time: (value, options) => dtf(options ?? { timeStyle: 'short' }).format(value),
    relativeTime: (value, unit, options) =>
      memo(`r|${locale}|${optKey(options)}`, () => new Intl.RelativeTimeFormat(locale, options)).format(value, unit),
    list: (items, options) =>
      memo(`l|${locale}|${optKey(options)}`, () => new Intl.ListFormat(locale, options)).format(items),
    plural: (value, options) =>
      memo(`p|${locale}|${optKey(options)}`, () => new Intl.PluralRules(locale, options)).select(value),
  };
}

/** Returns memoized locale-bound `Intl` formatters — `number`/`currency`/`percent`/`date`/`time`/`relativeTime`/`list`/`plural`. */
export function useLocaleFormatters(): LocaleFormatters {
  const { locale } = useLocale();
  return useMemo(() => createLocaleFormatters(locale), [locale]);
}
