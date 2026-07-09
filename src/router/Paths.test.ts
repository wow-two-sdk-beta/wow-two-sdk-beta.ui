import { describe, it, expect } from 'vitest';

import { definePath, type PathParams } from './Paths';

describe('definePath', () => {
  it('builds a no-param template with no arguments', () => {
    expect(definePath('/')()).toBe('/');
    expect(definePath('/projects')()).toBe('/projects');
    expect(definePath('/projects/new')()).toBe('/projects/new');
  });

  it('substitutes a single param', () => {
    expect(definePath('/projects/:id')({ id: 'abc' })).toBe('/projects/abc');
  });

  it('infers and substitutes multiple params in template order', () => {
    const build = definePath('/a/:x/b/:y');
    expect(build({ x: '1', y: '2' })).toBe('/a/1/b/2');
  });

  it('URL-encodes param values', () => {
    expect(definePath('/projects/:id')({ id: 'a b/c' })).toBe('/projects/a%20b%2Fc');
    expect(definePath('/transcript/:id')({ id: '007?x=1' })).toBe('/transcript/007%3Fx%3D1');
    expect(definePath('/projects/:id')({ id: 'café' })).toBe('/projects/caf%C3%A9');
  });

  it('carries the route pattern as `.pattern`', () => {
    expect(definePath('/projects/:id').pattern).toBe('/projects/:id');
    expect(definePath('/settings').pattern).toBe('/settings');
  });

  it('accepts the inferred param type', () => {
    const project = definePath('/projects/:id');
    const params: PathParams<'/projects/:id'> = { id: 'z' };
    expect(project(params)).toBe('/projects/z');
  });

  it('rejects missing / wrong / excess params at compile time', () => {
    const project = definePath('/projects/:id');
    // @ts-expect-error — `id` is required
    project();
    // @ts-expect-error — `id` is required
    project({});
    // @ts-expect-error — `extra` is not a declared param
    project({ id: '1', extra: 'x' });
    // @ts-expect-error — a no-param template accepts no arguments
    definePath('/projects')({ id: '1' });
    // @ts-expect-error — a param object is missing `id`
    const bad: PathParams<'/projects/:id'> = {};
    void bad;
    expect(true).toBe(true);
  });
});
