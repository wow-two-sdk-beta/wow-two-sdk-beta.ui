import { describe, expect, it } from 'vitest';
import { interpolate, resolveMessage } from '@src/foundation/i18n/LocaleContext';

describe('interpolate', () => {
  it('replaces {tokens} from vars, leaves unknowns intact', () => {
    expect(interpolate('Hi {name}', { name: 'Sam' })).toBe('Hi Sam');
    expect(interpolate('{a} + {b} = {c}', { a: 1, b: 2 })).toBe('1 + 2 = {c}');
    expect(interpolate('static')).toBe('static');
  });
});

describe('resolveMessage', () => {
  it('falls back to the SDK default, then the key', () => {
    expect(resolveMessage(undefined, 'dismiss', undefined, 'Dismiss')).toBe('Dismiss');
    expect(resolveMessage(undefined, 'unknown.key')).toBe('unknown.key');
  });

  it('applies a dictionary override with interpolation', () => {
    expect(resolveMessage({ greet: 'Hello {name}!' }, 'greet', { name: 'Sam' }, 'Hi {name}')).toBe('Hello Sam!');
  });

  it('applies a callback resolver', () => {
    expect(resolveMessage((key, vars) => `${key}:${vars?.n ?? '?'}`, 'count', { n: 3 })).toBe('count:3');
  });
});
