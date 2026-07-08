// storage — foundation seam. The generic, domain-agnostic client-side persistence contract
// (`StorageBroker`) plus its two implementations: `localStorageStorageBroker` (production, SSR-safe) and
// `memoryStorageBroker` (isolated in-memory double). The persistence hooks in `foundation/hooks`
// (`usePersistentState`, `useRecentItems`) read and write through this seam.

export {
  type StorageBroker,
  localStorageStorageBroker,
  memoryStorageBroker,
} from './StorageBroker';
