/* Generates src/manifest.gen.json:
   - domains: every named export per lib domain barrel (the full component universe)
   - routes:  per page module, the `@wow-two-beta/ui/{domain}` named imports it
              (and its descendants in the same module folder) actually use.
   Auto-extracted so coverage can never silently go stale. */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appSrc = path.resolve(here, '../src');
const libSrc = path.resolve(here, '../../../src');

const DOMAINS = ['actions', 'display', 'feedback', 'forms', 'layout', 'nav', 'overlays', 'primitives', 'hooks', 'icons', 'utils'];

/** Named value exports of a barrel, following `export * from './x'` one hop
    into component-folder barrels (aliased name wins; `export type` and
    `default` excluded). */
function collectExports(file, names, seen) {
  if (seen.has(file)) return;
  seen.add(file);
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const match of text.matchAll(/export\s+(?:type\s+)?{([^}]*)}(?:\s+from\s+['"][^'"]+['"])?/g)) {
    if (/^export\s+type/.test(match[0])) continue;
    for (const raw of match[1].split(',')) {
      const entry = raw.trim();
      if (!entry || entry.startsWith('type ')) continue;
      const alias = entry.split(/\s+as\s+/);
      const name = (alias[1] ?? alias[0]).trim();
      if (name && name !== 'default') names.add(name);
    }
  }
  for (const match of text.matchAll(/export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g)) {
    const target = path.resolve(path.dirname(file), match[1]);
    const candidates = [`${target}.ts`, `${target}.tsx`, path.join(target, 'index.ts')];
    for (const candidate of candidates) {
      try {
        statSync(candidate);
        collectExports(candidate, names, seen);
        break;
      } catch {
        /* try next candidate */
      }
    }
  }
  // `export const x` / `export function X` / `export default function X` are
  // rare in barrels but appear in leaf files reached via `export *`.
  for (const match of text.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z0-9_]+)/g)) {
    names.add(match[1]);
  }
}

function barrelExports(domain) {
  const names = new Set();
  collectExports(path.join(libSrc, domain, 'index.ts'), names, new Set());
  return [...names].sort();
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(name)) yield full;
  }
}

/** Page module key for a file under src/ — mirrors routes.tsx `module` values. */
function moduleKey(file) {
  const rel = path.relative(appSrc, file).replace(/\\/g, '/');
  const [top, second] = rel.split('/');
  if (top === 'screens') return `screens/${second}`;
  if (top === 'galleries' || top === 'coverage') return `${top}/${second.replace(/\.(ts|tsx)$/, '')}`;
  return null;
}

function usedImports(text) {
  const used = [];
  for (const match of text.matchAll(/import\s+(?:type\s+)?{([^}]*)}\s+from\s+['"]@wow-two-beta\/ui\/([a-z]+)['"]/g)) {
    const domain = match[2];
    for (const raw of match[1].split(',')) {
      const entry = raw.trim();
      if (!entry || entry.startsWith('type ')) continue;
      const name = entry.split(/\s+as\s+/)[0].trim();
      if (name) used.push(`${domain}/${name}`);
    }
  }
  return used;
}

const domains = Object.fromEntries(DOMAINS.map((d) => [d, barrelExports(d)]).filter(([, list]) => list.length > 0));

const routes = {};
for (const file of walk(appSrc)) {
  const key = moduleKey(file);
  if (!key) continue;
  const used = usedImports(readFileSync(file, 'utf8'));
  if (used.length === 0) continue;
  routes[key] = [...new Set([...(routes[key] ?? []), ...used])].sort();
}

const out = path.join(appSrc, 'manifest.gen.json');
writeFileSync(out, `${JSON.stringify({ domains, routes }, null, 2)}\n`);
console.log(`manifest: ${Object.keys(routes).length} route modules, ${Object.values(domains).flat().length} exports across ${Object.keys(domains).length} domains → ${path.relative(process.cwd(), out)}`);
