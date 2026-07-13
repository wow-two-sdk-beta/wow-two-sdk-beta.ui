import { Suspense } from 'react';
import { act, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { renderWithQuery } from '@src/query/QueryTestUtils';
import { useAppSuspenseQuery } from '@src/query/UseAppSuspenseQuery';

/** A promise plus its resolve handle — lets a test hold a query pending, then release it. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useAppSuspenseQuery', () => {
  it('shows the fallback while pending, then renders resolved data', async () => {
    const gate = deferred<string>();

    function Probe() {
      const { data } = useAppSuspenseQuery<string>({ key: ['probe'], queryFn: () => gate.promise });
      return <p>{data}</p>;
    }

    renderWithQuery(
      <Suspense fallback={<span>loading</span>}>
        <Probe />
      </Suspense>,
    );

    expect(screen.getByText('loading')).toBeInTheDocument();

    await act(async () => {
      gate.resolve('resolved-value');
    });

    expect(await screen.findByText('resolved-value')).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('applies map to project the raw result into the view shape', async () => {
    function MapProbe() {
      const { data } = useAppSuspenseQuery<string, number>({
        key: ['probe-map'],
        queryFn: async () => 'abcd',
        map: (raw) => raw.length,
      });
      return <p>len:{data}</p>;
    }

    renderWithQuery(
      <Suspense fallback={<span>loading</span>}>
        <MapProbe />
      </Suspense>,
    );

    expect(await screen.findByText('len:4')).toBeInTheDocument();
  });
});
