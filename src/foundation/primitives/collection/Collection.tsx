import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Context,
  type ReactNode,
} from 'react';

export interface CollectionContextValue<T> {
  items: T[];
  register: (item: T) => void;
  unregister: (item: T) => void;
}

/**
 * Factory for a typed children-registry context. Compound components
 * (Menu, Tabs, Listbox) use this so the parent can iterate ordered children
 * without prop-drilling.
 */
export function createCollection<T>(): {
  Provider: (props: { children: ReactNode }) => ReactNode;
  useCollection: () => CollectionContextValue<T>;
  Context: Context<CollectionContextValue<T> | null>;
} {
  const CollectionContext = createContext<CollectionContextValue<T> | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<T[]>([]);
    const register = useCallback((item: T) => {
      setItems((prev) => (prev.includes(item) ? prev : [...prev, item]));
    }, []);
    const unregister = useCallback((item: T) => {
      setItems((prev) => prev.filter((i) => i !== item));
    }, []);
    const value = useMemo(() => ({ items, register, unregister }), [items, register, unregister]);
    return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
  }

  function useCollection(): CollectionContextValue<T> {
    const ctx = useContext(CollectionContext);
    if (!ctx) {
      throw new Error('useCollection must be used inside its Provider');
    }
    return ctx;
  }

  return { Provider, useCollection, Context: CollectionContext };
}
