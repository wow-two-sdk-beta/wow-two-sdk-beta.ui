/* Build-environment value set + derived flags. Follows the library's const-object
   enum pattern (cf. HtmlElement, ButtonType, Key) — not a domain enum. */

export const Environment = {
  Development: 'development',
  Production: 'production',
  Test: 'test',
} as const;
export type Environment = (typeof Environment)[keyof typeof Environment];

/* Gate dev-only warnings/affordances on these. The literal `'production'` is kept
   inline so the consumer's bundler folds it and dev branches dead-code-eliminate. */
export const IS_DEV = process.env.NODE_ENV !== 'production';
export const IS_PRODUCTION = !IS_DEV;
