import { describe, expect, it } from 'vitest';

import {
  capitalize,
  formatBytes,
  formatDuration,
  initials,
  maskString,
  ordinal,
  ordinalSuffix,
  pluralize,
  slugify,
  titleCase,
  truncate,
} from '@src/foundation/format';

// Node project — every helper is pure. No locale/DOM dependence (casing/slug use default-locale case mapping).

describe('formatBytes', () => {
  it('formats decimal (SI) sizes by default', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1000)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1_500_000)).toBe('1.5 MB');
  });

  it('formats binary (IEC) sizes when requested', () => {
    expect(formatBytes(1024, { binary: true })).toBe('1 KiB');
    expect(formatBytes(1_048_576, { binary: true })).toBe('1 MiB');
  });

  it('honors decimals and the space option, and preserves sign', () => {
    expect(formatBytes(1536, { decimals: 2 })).toBe('1.54 KB');
    expect(formatBytes(1536, { space: false })).toBe('1.5KB');
    expect(formatBytes(-2048)).toBe('-2 KB');
  });

  it('throws on a non-finite input', () => {
    expect(() => formatBytes(NaN)).toThrow(RangeError);
    expect(() => formatBytes(Infinity)).toThrow(RangeError);
  });
});

describe('formatDuration', () => {
  it('renders the most-significant segments', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(20_000)).toBe('20s');
    expect(formatDuration(200_000)).toBe('3m 20s');
    expect(formatDuration(3_661_000)).toBe('1h 1m'); // default 2 segments drops the trailing 1s
  });

  it('respects the units cap and the ms option', () => {
    expect(formatDuration(3_661_000, { units: 3 })).toBe('1h 1m 1s');
    expect(formatDuration(90_500, { units: 3, ms: true })).toBe('1m 30s 500ms');
    expect(formatDuration(-90_000)).toBe('-1m 30s');
  });
});

describe('truncate', () => {
  it('leaves short text untouched and cuts long text with an ellipsis', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('cuts on a word boundary when asked', () => {
    expect(truncate('hello world foo', 12, { wordBoundary: true })).toBe('hello…');
  });

  it('uses a custom ellipsis', () => {
    expect(truncate('abcdefgh', 6, { ellipsis: '...' })).toBe('abc...');
  });
});

describe('casing + slug', () => {
  it('capitalizes and title-cases', () => {
    expect(capitalize('hello there')).toBe('Hello there');
    expect(titleCase('hello   wonderful WORLD')).toBe('Hello   Wonderful World');
  });

  it('slugifies, stripping diacritics and punctuation', () => {
    expect(slugify('Héllo, World!')).toBe('hello-world');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    expect(slugify('Wow_Two v2.0', { separator: '_' })).toBe('wow_two_v2_0');
  });
});

describe('initials + mask', () => {
  it('takes first+last initials', () => {
    expect(initials('John Doe')).toBe('JD');
    expect(initials('John Ronald Reuel Tolkien')).toBe('JT');
    expect(initials('madonna')).toBe('M');
    expect(initials('  ')).toBe('');
  });

  it('masks all but the visible tail (or head)', () => {
    expect(maskString('4242424242424242')).toBe('••••••••••••4242');
    expect(maskString('secret', { visible: 2, side: 'start' })).toBe('se••••');
    expect(maskString('abc', { visible: 4 })).toBe('•••'); // shorter than visible → fully masked
  });
});

describe('pluralize + ordinal', () => {
  it('pluralizes by count', () => {
    expect(pluralize(1, 'item')).toBe('item');
    expect(pluralize(2, 'item')).toBe('items');
    expect(pluralize(0, 'item')).toBe('items');
    expect(pluralize(3, 'child', 'children')).toBe('children');
  });

  it('produces English ordinals incl. the 11–13 exception', () => {
    expect(['1st', '2nd', '3rd', '4th'].map((_, i) => ordinal(i + 1))).toEqual(['1st', '2nd', '3rd', '4th']);
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
    expect(ordinal(21)).toBe('21st');
    expect(ordinal(112)).toBe('112th');
    expect(ordinalSuffix(22)).toBe('nd');
  });
});
