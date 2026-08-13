/** Defines where a bearer strategy keeps its token — implement over `localStorage`/`StorageBroker` when a session must survive reloads. */
export interface TokenStorage {
  /** Reads the stored token, or `null` when signed out. */
  get(): string | null;

  /** Stores a new token, or clears it with `null`. */
  set(token: string | null): void;
}

/** Creates the default in-memory token storage — deliberately never persisted, so a reload requires re-login (keeps the token off disk). */
export function createMemoryTokenStorage(): TokenStorage {
  let token: string | null = null;
  return {
    get: () => token,
    set: (next) => {
      token = next;
    },
  };
}
