/* ---------------------------------------------------------------------------
 * CSS emitter — scoped blocks per theme, including the optional backdrop.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';
import { themeToCss } from '@src/foundation/themes/css';
import { getTheme } from '@src/foundation/themes/registry';

/** Split an emitted theme into its light and dark blocks. */
function blocks(id: string): { light: string; dark: string } {
  const theme = getTheme(id);
  if (!theme) throw new Error(`unknown theme ${id}`);
  const [light = '', dark = ''] = themeToCss(theme).split('\n\n');
  return { light, dark };
}

describe('themeToCss', () => {
  it('writes each mode of a glass theme backdrop into its own block', () => {
    const frost = getTheme('frost');
    const { light, dark } = blocks('frost');
    expect(light.startsWith('.theme-frost {')).toBe(true);
    expect(light).toContain(`--theme-ambient: ${frost?.ambient?.light};`);
    expect(dark.startsWith('.dark.theme-frost {')).toBe(true);
    expect(dark).toContain(`--theme-ambient: ${frost?.ambient?.dark};`);
  });

  it('leaves the backdrop out of a flat theme', () => {
    const { light, dark } = blocks('bento-deck');
    expect(light).not.toContain('--theme-ambient');
    expect(dark).not.toContain('--theme-ambient');
  });

  it('emits the large radius knob for an authored theme', () => {
    expect(blocks('glass-harbor').light).toContain('--radius-xl: 1.25rem;');
  });
});
