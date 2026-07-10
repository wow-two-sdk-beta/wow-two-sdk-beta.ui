// @wow-two-beta/ui/query/testing — test-only helpers for the query layer, kept out of the runtime
// `/query` barrel so `@testing-library/react` never leaks into a shipped app bundle. Imported only
// from tests: `import { renderWithQuery, createTestQueryClient, createQueryWrapper } from
// '@wow-two-beta/ui/query/testing'`.
export {
  createTestQueryClient,
  renderWithQuery,
  createQueryWrapper,
  type RenderWithQueryOptions,
  type RenderWithQueryResult,
} from './QueryTestUtils';
