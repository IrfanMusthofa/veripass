import { db } from "../db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";
import { calculateHash } from "../lib/hash";
import { NotFoundException, ConflictException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import { type CreateAssetInput, type AssetResponse, formatAssetResponse } from "../dtos/asset.dto";
import type { AuthUser } from "../types";

export async function createAsset(
  input: CreateAssetInput,
  authUser: AuthUser
): Promise<SuccessResponse<AssetResponse>> {
  // Check if asset already exists
  const existing = await db
    .select()
    .from(assets)
    .where(eq(assets.assetId, input.assetId))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictException("Asset already exists");
  }

  // Calculate data hash (only core metadata fields)
  const metadata = {
    manufacturer: input.manufacturer,
    model: input.model,
    serialNumber: input.serialNumber,
    manufacturedDate: input.manufacturedDate,
    description: input.description,
  };

  const dataHash = calculateHash(metadata);

  // Insert asset
  const inserted = await db
    .insert(assets)
    .values({
      assetId: input.assetId,
      dataHash,
      manufacturer: input.manufacturer,
      model: input.model,
      serialNumber: input.serialNumber,
      manufacturedDate: input.manufacturedDate,
      description: input.description || null,
      images: input.images || [],
      metadata: input.metadata || null,
      createdBy: authUser.address,
    })
    .returning();

  return createSuccessResponse(
    formatAssetResponse(inserted[0]),
    "Asset created successfully"
  );
}

export async function getAssetByHash(
  dataHash: string
): Promise<SuccessResponse<AssetResponse>> {
  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.dataHash, dataHash))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  return createSuccessResponse(
    formatAssetResponse(result[0]),
    "Asset retrieved successfully"
  );
}

export async function getAssetById(
  assetId: number
): Promise<SuccessResponse<AssetResponse>> {
  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.assetId, assetId))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  return createSuccessResponse(
    formatAssetResponse(result[0]),
    "Asset retrieved successfully"
  );
}
