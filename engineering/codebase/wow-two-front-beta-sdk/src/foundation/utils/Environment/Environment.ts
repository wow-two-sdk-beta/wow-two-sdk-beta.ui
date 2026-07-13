/** Defines the build environment. */
export const Environment = {
  /** Refers to a local development build. */
  Development: 'development',
  /** Refers to a production build. */
  Production: 'production',
  /** Refers to a test build. */
  Test: 'test',
} as const;

export type Environment = (typeof Environment)[keyof typeof Environment];

/* Gate dev-only warnings/affordances on these. The literal `'production'` is kept
   inline so the consumer's bundler folds it and dev branches dead-code-eliminate. */
export const IS_DEV = process.env.NODE_ENV !== 'production';
export const IS_PRODUCTION = !IS_DEV;
