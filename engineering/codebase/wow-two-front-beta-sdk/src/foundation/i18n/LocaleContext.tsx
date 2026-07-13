import { createContext, useContext, useMemo, type ReactNode } from 'react';

/** Interpolation variables for a message template (`Hello {name}` + `{ name: 'Sam' }`). */
export type MessageVars = Record<string, string | number>;

/** A message resolver — a `key → template` dictionary, or a `(key, vars) => string` callback (bring-your-own ICU). */
export type Messages = Record<string, string> | ((key: string, vars?: MessageVars) => string);

/** Replaces `{token}` placeholders from `vars`; leaves unknown tokens untouched. */
export function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, token: string) => (token in vars ? String(vars[token]) : match));
}

/** Resolves a message: consumer `messages` override (dict or callback) → SDK-authored `fallback` → the raw key. */
export function resolveMessage(
  messages: Messages | undefined,
  key: string,
  vars?: MessageVars,
  fallback?: string,
): string {
  if (typeof messages === 'function') return messages(key, vars);
  return interpolate(messages?.[key] ?? fallback ?? key, vars);
}

/** The active locale + message resolver exposed by `useLocale`. */
export interface LocaleContextValue {
  /** The active BCP-47 locale (e.g. `en-US`, `de`). */
  locale: string;
  /** Resolves a message key — consumer override, else the SDK-authored `fallback`, else the key. */
  t: (key: string, vars?: MessageVars, fallback?: string) => string;
}

const DEFAULT_LOCALE = 'en-US';

/** Used when no `LocaleProvider` is mounted — `en-US` + fallback-only messages, so components work standalone. */
const FALLBACK_CONTEXT: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  t: (key, vars, fallback) => interpolate(fallback ?? key, vars),
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

/** Props for {@link LocaleProvider}. */
export interface LocaleProviderProps {
  /** BCP-47 locale. Defaults to `navigator.language`, then `en-US`. */
  locale?: string;
  /** Consumer message overrides — a dictionary or a `(key, vars) => string` callback. */
  messages?: Messages;
  children: ReactNode;
}

/** Provides the active locale + message overrides to every descendant SDK component. */
export function LocaleProvider({ locale, messages, children }: LocaleProviderProps): ReactNode {
  const resolved = locale ?? (typeof navigator !== 'undefined' ? navigator.language : undefined) ?? DEFAULT_LOCALE;
  const value = useMemo<LocaleContextValue>(
    () => ({ locale: resolved, t: (key, vars, fallback) => resolveMessage(messages, key, vars, fallback) }),
    [resolved, messages],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Reads the active locale + `t`. Works without a provider — defaults to `en-US` + fallback-only messages. */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext) ?? FALLBACK_CONTEXT;
}
