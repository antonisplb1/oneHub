import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export interface Store {
  id: string;
  userId: string;
  shopName: string;
  displayName: string | null;
  logo: string | null;
  menuBannerImage: string | null;
  cardBackgroundColor: string | null;
  shiftAccessPin: string | null;
  selectedProducts: string[];
  createdAt: string;
}

interface AuthMeResponse {
  isSubuser?: boolean;
  subuserStoreIds?: string[] | null;
}

interface StoreContextValue {
  stores: Store[];
  activeStore: Store | null;
  activeStoreId: string | null;
  setActiveStoreId: (id: string) => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextValue>({
  stores: [],
  activeStore: null,
  activeStoreId: null,
  setActiveStoreId: () => {},
  isLoading: true,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(() => {
    return localStorage.getItem("activeStoreId");
  });

  const { data: rawStores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: isAuthenticated && !authLoading,
  });

  const { data: authInfo } = useQuery<AuthMeResponse>({
    queryKey: ["/api/auth/me"],
    enabled: isAuthenticated && !authLoading,
  });

  // Client-side defensive filter: if the session says this is a subuser with a
  // restricted store list, only expose those stores — even if the API somehow
  // returned extras. The backend at /api/stores already applies this filter;
  // this is a belt-and-suspenders guard.
  const stores: Store[] = (() => {
    if (authInfo?.isSubuser && Array.isArray(authInfo.subuserStoreIds)) {
      const allowed = authInfo.subuserStoreIds;
      return rawStores.filter(s => allowed.includes(s.id));
    }
    return rawStores;
  })();

  useEffect(() => {
    if (stores.length > 0) {
      const stored = localStorage.getItem("activeStoreId");
      const valid = stored && stores.find(s => s.id === stored);
      if (!valid) {
        const first = stores[0].id;
        setActiveStoreIdState(first);
        localStorage.setItem("activeStoreId", first);
      } else {
        setActiveStoreIdState(stored!);
      }
    }
  }, [stores]);

  const setActiveStoreId = (id: string) => {
    if (id === activeStoreId) return;
    setActiveStoreIdState(id);
    localStorage.setItem("activeStoreId", id);
    // Store-scoped queries (loyalty settings/cards, customers, menu, shifts, etc.)
    // use store-agnostic cache keys with staleTime: Infinity and send the active
    // store via the X-Store-Id header. Switching stores must invalidate the cache
    // or the previous store's data would keep showing under the newly-active store.
    // Centralizing this here guarantees every switch path (header switcher, stores
    // page, create, delete) stays consistent instead of relying on each call site.
    queryClient.invalidateQueries();
  };

  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0] || null;

  return (
    <StoreContext.Provider value={{ stores, activeStore, activeStoreId: activeStore?.id || null, setActiveStoreId, isLoading }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
