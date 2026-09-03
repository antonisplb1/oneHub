import { QueryClient, QueryFunction } from "@tanstack/react-query";

export const CURRENT_USER_QUERY_KEY = ["/api", "auth", "me"] as const;

export function redirectExpiredSession(res: Response) {
  if (res.status !== 401 || typeof window === "undefined") return;

  const path = window.location.pathname;
  const isAuthenticatedPage =
    path === "/scan" ||
    path.startsWith("/dashboard") ||
    path === "/select-products" ||
    path === "/subscription-required" ||
    path === "/payment-processing";

  if (!isAuthenticatedPage) return;

  const destination = `${path}${window.location.search}`;
  window.location.assign(`/auth?redirect=${encodeURIComponent(destination)}`);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    redirectExpiredSession(res);
    let errorMessage = res.statusText;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        const text = await res.text();
        errorMessage = text || errorMessage;
      }
    } catch (e) {
      // If parsing fails, use statusText
    }
    throw new Error(errorMessage);
  }
}

function getActiveStoreHeader(): Record<string, string> {
  const storeId = localStorage.getItem("activeStoreId");
  return storeId ? { "X-Store-Id": storeId } : {};
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getActiveStoreHeader(),
      ...options?.headers,
    },
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        ...getActiveStoreHeader(),
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
