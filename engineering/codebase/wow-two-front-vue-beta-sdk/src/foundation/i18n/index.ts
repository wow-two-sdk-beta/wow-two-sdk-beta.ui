export * from './LocaleContext';
export * from './LocaleFormatters';

// `LocaleProvider` and `FormattedRelative` are SFCs, so they need a named re-export rather than a `export *`
// (a `.vue` module's only meaningful export is its default). The provide/inject half of `LocaleProvider` lives
// in `LocaleContext.ts` as `provideLocale`, so a component that owns a locale needs no wrapper element.
export { default as LocaleProvider, type LocaleProviderProps } from './LocaleProvider.vue';
export { default as FormattedRelative, type FormattedRelativeProps } from './FormattedRelative.vue';
