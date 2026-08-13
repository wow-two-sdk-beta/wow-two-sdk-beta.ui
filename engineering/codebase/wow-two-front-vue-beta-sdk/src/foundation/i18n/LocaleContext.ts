import { computed, inject, provide, toValue, type ComputedRef, type InjectionKey, type MaybeRefOrGetter } from 'vue';

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

/**
 * The active locale + message resolver exposed by `useLocale`.
 *
 * `locale` is a `ComputedRef` rather than a bare string — Vue's `provide` is not reactive on its own, and a
 * consumer switching locales must re-evaluate every descendant. `t` stays a plain function: it reads the
 * provider's messages at CALL time, so invoking it inside a `computed` tracks a message-table swap without
 * `t` itself ever changing identity.
 */
export interface LocaleContextValue {
  /** The active BCP-47 locale (e.g. `en-US`, `de`). */
  locale: ComputedRef<string>;
  /** Resolves a message key — consumer override, else the SDK-authored `fallback`, else the key. */
  t: (key: string, vars?: MessageVars, fallback?: string) => string;
}

const DEFAULT_LOCALE = 'en-US';

/** The injection key — React's `createContext(undefined)` becomes a key plus a default at the injection site. */
export const LocaleKey: InjectionKey<LocaleContextValue> = Symbol('wow-two.locale');

/**
 * The provider half — used by `LocaleProvider`, and by any component that owns a locale.
 *
 * `navigator.language` is read lazily, inside the `computed`, and guarded: a `computed` is only evaluated when
 * something reads it, so a server render that never touches `locale` never touches `navigator`, and one that
 * does falls through to `en-US` instead of throwing.
 */
export function provideLocale(
  locale?: MaybeRefOrGetter<string | undefined>,
  messages?: MaybeRefOrGetter<Messages | undefined>,
): LocaleContextValue {
  const value: LocaleContextValue = {
    locale: computed(
      () => toValue(locale) ?? (typeof navigator !== 'undefined' ? navigator.language : undefined) ?? DEFAULT_LOCALE,
    ),
    t: (key, vars, fallback) => resolveMessage(toValue(messages), key, vars, fallback),
  };
  provide(LocaleKey, value);
  return value;
}

/** Reads the active locale + `t`. Works without a provider — defaults to `en-US` + fallback-only messages. */
export function useLocale(): LocaleContextValue {
  return inject(
    LocaleKey,
    () => ({
      locale: computed(() => DEFAULT_LOCALE),
      t: (key: string, vars?: MessageVars, fallback?: string) => interpolate(fallback ?? key, vars),
    }),
    true,
  );
}
