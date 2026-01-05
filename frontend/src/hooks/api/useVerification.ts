import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateVerificationRequest, VerificationRequestResponse, ApiResponse } from '@/types/api';

// Query key factory
export const verificationKeys = {
  all: ['verification'] as const,
  request: (requestId: string) => [...verificationKeys.all, 'request', requestId] as const,
  byAsset: (assetId: number) => [...verificationKeys.all, 'byAsset', assetId] as const,
};

// Create verification request mutation
export function useCreateVerificationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVerificationRequest) => api.createVerificationRequest(data),
    onSuccess: (response) => {
      // Store the request in cache
      queryClient.setQueryData(
        verificationKeys.request(response.data.requestId),
        response
      );
    },
  });
}

// Poll verification request status
export function useVerificationStatus(
  requestId: string | undefined,
  options?: {
    enabled?: boolean;
    pollInterval?: number;
  }
) {
  const { enabled = true, pollInterval = 5000 } = options || {};

  return useQuery<ApiResponse<VerificationRequestResponse>>({
    queryKey: verificationKeys.request(requestId!),
    queryFn: async () => {
      // Note: This endpoint doesn't exist in current backend
      // For now, we'll use the cached data from creation
      // In production, you'd add a GET endpoint for this
      throw new Error('Polling not implemented - use event timeline to track status');
    },
    enabled: enabled && !!requestId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop polling if completed or failed
      if (data?.data.status === 'COMPLETED' || data?.data.status === 'FAILED') {
        return false;
      }
      return pollInterval;
    },
    retry: false,
  });
}

// Get service records for verification
export function useServiceRecords(assetId: number | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['serviceRecords', assetId],
    queryFn: () => api.getServiceRecords(assetId!),
    enabled: enabled && assetId !== undefined,
    staleTime: 60 * 1000, // 1 minute
  });
}
