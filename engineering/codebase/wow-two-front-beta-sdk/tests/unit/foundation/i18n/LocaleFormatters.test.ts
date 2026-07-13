import { describe, expect, it } from 'vitest';
import { createLocaleFormatters } from '@src/foundation/i18n/LocaleFormatters';

describe('createLocaleFormatters (en-US)', () => {
  const f = createLocaleFormatters('en-US');

  it('formats numbers, currency, percent', () => {
    expect(f.number(1234.5)).toBe('1,234.5');
    expect(f.currency(5, 'USD')).toBe('$5.00');
    expect(f.percent(0.25)).toBe('25%');
  });

  it('formats relative time + lists', () => {
    expect(f.relativeTime(-3, 'day')).toBe('3 days ago');
    expect(f.list(['a', 'b', 'c'])).toBe('a, b, and c');
  });

  it('selects plural categories', () => {
    expect(f.plural(1)).toBe('one');
    expect(f.plural(2)).toBe('other');
  });
});

describe('createLocaleFormatters (locale-aware)', () => {
  it('formats per the given locale', () => {
    expect(createLocaleFormatters('de-DE').number(1234.5)).toBe('1.234,5');
    expect(createLocaleFormatters('de-DE').currency(5, 'EUR')).toContain('5,00');
    expect(createLocaleFormatters('en-US').number(1234.5)).not.toBe(createLocaleFormatters('de-DE').number(1234.5));
  });

  it('exposes the bound locale', () => {
    expect(createLocaleFormatters('fr-FR').locale).toBe('fr-FR');
  });
});
