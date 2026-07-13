import { renderHook, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';

import { createQueryWrapper, createTestQueryClient, renderWithQuery } from '@src/query/QueryTestUtils';

/** Reads the client from context and reports whether the provider is present. */
function ClientProbe() {
  const client = useQueryClient();
  return <span>{client ? 'has-client' : 'no-client'}</span>;
}

describe('QueryTestUtils', () => {
  it('renderWithQuery mounts a component that can read the client', () => {
    renderWithQuery(<ClientProbe />);

    expect(screen.getByText('has-client')).toBeInTheDocument();
  });

  it('renderWithQuery uses the provided client and returns it', () => {
    const client = createTestQueryClient();
    const { client: used } = renderWithQuery(<ClientProbe />, { client });

    expect(used).toBe(client);
  });

  it('createTestQueryClient disables retries', () => {
    const client = createTestQueryClient();

    expect(client.getDefaultOptions().queries?.retry).toBe(false);
  });

  it('createQueryWrapper provides the client to renderHook', () => {
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryClient(), { wrapper: createQueryWrapper(client) });

    expect(result.current).toBe(client);
  });
});
