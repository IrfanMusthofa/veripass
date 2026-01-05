import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UserResponse, ApiResponse } from '@/types/api';

// Query key factory
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

// Get current user query
export function useCurrentUser(enabled: boolean = true) {
  return useQuery<ApiResponse<UserResponse>>({
    queryKey: authKeys.user(),
    queryFn: () => api.getCurrentUser(),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Sign in mutation (typically handled by AuthProvider, but available as hook)
export function useSignInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      message,
      signature,
    }: {
      address: string;
      message: string;
      signature: string;
    }) => {
      return api.verify({ address, message, signature });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

// Get nonce mutation
export function useGetNonce() {
  return useMutation({
    mutationFn: (address: string) => api.getNonce(address),
  });
}
