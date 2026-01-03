import { z } from "zod";
import type { Asset } from "../db/schema";

export const createAssetSchema = z.object({
  assetId: z.number().int().positive(),
  manufacturer: z.string().min(1).max(255),
  model: z.string().min(1).max(255),
  serialNumber: z.string().min(1).max(255),
  manufacturedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const assetIdParamSchema = z.object({
  assetId: z.coerce.number().int().positive(),
});

export const hashParamSchema = z.object({
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type AssetIdParam = z.infer<typeof assetIdParamSchema>;
export type HashParam = z.infer<typeof hashParamSchema>;

export interface AssetResponse {
  id: number;
  assetId: number;
  dataHash: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  manufacturedDate: string | null;
  description: string | null;
  images: string[];
  metadata: Record<string, unknown> | null;
  createdBy: string;
  createdAt: string;
}

export function formatAssetResponse(asset: Asset): AssetResponse {
  return {
    id: asset.id,
    assetId: Number(asset.assetId),
    dataHash: asset.dataHash,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serialNumber: asset.serialNumber,
    manufacturedDate: asset.manufacturedDate,
    description: asset.description,
    images: (asset.images as string[]) || [],
    metadata: asset.metadata as Record<string, unknown> | null,
    createdBy: asset.createdBy,
    createdAt: asset.createdAt.toISOString(),
  };
}
