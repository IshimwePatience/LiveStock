import { QueryClient } from '@tanstack/react-query';

// Configure TanStack Query for offline resilience and caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed requests twice
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      networkMode: 'offlineFirst', // Works gracefully offline
    },
    mutations: {
      networkMode: 'offlineFirst',
    }
  },
});
