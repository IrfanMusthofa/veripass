import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateEvidenceRequest, EvidenceResponse, ApiResponse } from '@/types/api';

// Query key factory
export const evidenceKeys = {
  all: ['evidence'] as const,
  byAsset: (assetId: number) => [...evidenceKeys.all, 'byAsset', assetId] as const,
  byHash: (hash: string) => [...evidenceKeys.all, 'byHash', hash] as const,
};

// Get evidence by asset ID
export function useEvidenceByAsset(assetId: number | undefined, enabled: boolean = true) {
  return useQuery<ApiResponse<EvidenceResponse[]>>({
    queryKey: evidenceKeys.byAsset(assetId!),
    queryFn: () => api.getEvidenceByAsset(assetId!),
    enabled: enabled && assetId !== undefined,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Get evidence by hash
export function useEvidenceByHash(hash: string | undefined, enabled: boolean = true) {
  return useQuery<ApiResponse<EvidenceResponse>>({
    queryKey: evidenceKeys.byHash(hash!),
    queryFn: () => api.getEvidenceByHash(hash!),
    enabled: enabled && !!hash,
    staleTime: 30 * 1000,
  });
}

// Create evidence mutation
export function useCreateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEvidenceRequest) => api.createEvidence(data),
    onSuccess: (response) => {
      // Invalidate evidence queries for this asset
      queryClient.invalidateQueries({
        queryKey: evidenceKeys.byAsset(response.data.assetId),
      });
    },
  });
}
