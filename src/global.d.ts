// Minimal ambient typing for the bundler-replaced `process.env.NODE_ENV` literal — the lib has no
// `@types/node`, but Vite/tsup statically inline this expression so dev-only warns drop in prod builds.
declare const process: { env: { NODE_ENV?: string } };

// Minimal ambient typing for the bundler-replaced `import.meta.env.DEV` flag read by the query
// devtools mount (`src/query/Devtools.tsx`) — the lib doesn't reference `vite/client`, so declare
// only the field it uses. The consumer's Vite statically inlines it, so the devtools dynamic import
// is tree-shaken from prod builds.
interface ImportMetaEnv {
  readonly DEV: boolean;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
