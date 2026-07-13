import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QueryDevtools } from '@src/query/Devtools';

describe('QueryDevtools', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders nothing when not in dev', () => {
    vi.stubEnv('DEV', false);

    const { container } = render(<QueryDevtools />);

    expect(container).toBeEmptyDOMElement();
  });
});
