import { describe, expect, it } from 'vitest';
import { toastSimpleVariants } from '@src/presentation/feedback/toastSimple/ToastSimple.variants';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vitest stubs stylesheet imports, so the published file is read from disk.
const stylesheet = readFileSync(resolve(process.cwd(), 'src/presentation/feedback/toastHost/styles.css'), 'utf8');

describe('component-only toast stylesheet', () => {
  it('lists every toast card variant class it does not scan', () => {
    const listed = new Set(stylesheet.match(/@source inline\('([^']*)'\)/)?.[1]?.split(/\s+/) ?? []);
    const config = toastSimpleVariants as unknown as { base: string; variants: { severity: Record<string, string> } };
    const required = [config.base, ...Object.values(config.variants.severity)].flatMap((value) => value.split(/\s+/));
    expect(required.length).toBeGreaterThan(0);
    for (const className of required) expect(listed, className).toContain(className);
  });
});
