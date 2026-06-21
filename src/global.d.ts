// Minimal ambient typing for the bundler-replaced `process.env.NODE_ENV` literal — the lib has no
// `@types/node`, but Vite/tsup statically inline this expression so dev-only warns drop in prod builds.
declare const process: { env: { NODE_ENV?: string } };
