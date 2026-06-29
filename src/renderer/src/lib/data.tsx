import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Substitui o router.refresh() do Next: um "version" global que, ao ser
// incrementado, faz todas as telas (e a sidebar) re-buscarem seus dados.
const RefreshContext = createContext<{ version: number; refresh: () => void }>({
  version: 0,
  refresh: () => {},
});

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return (
    <RefreshContext.Provider value={{ version, refresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext).refresh;
}

/**
 * Carrega dados assíncronos e re-carrega quando `deps` mudam OU quando o
 * `refresh()` global é disparado após uma mutação.
 */
export function useData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | undefined; loading: boolean } {
  const { version } = useContext(RefreshContext);
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loader().then((d) => {
      if (alive) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return { data, loading };
}
