import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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
  createdAt: string;
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

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: isAuthenticated && !authLoading,
  });

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
    setActiveStoreIdState(id);
    localStorage.setItem("activeStoreId", id);
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
