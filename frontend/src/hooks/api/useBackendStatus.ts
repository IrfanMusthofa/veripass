import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Query key
export const backendStatusKey = ['backendStatus'] as const;

// Check backend availability
export function useBackendStatus(pollInterval: number = 30000) {
  return useQuery({
    queryKey: backendStatusKey,
    queryFn: () => api.checkAvailability(),
    staleTime: pollInterval,
    refetchInterval: pollInterval,
    retry: false,
  });
}

// Simple hook to get backend availability
export function useIsBackendAvailable() {
  const { data, isLoading } = useBackendStatus();
  return {
    isAvailable: data ?? false,
    isChecking: isLoading,
  };
}
