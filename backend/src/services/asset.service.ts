import { db } from "../db";
import { assets } from "../db/schema";
import { eq } from "drizzle-orm";
import { calculateHash } from "../lib/hash";
import { NotFoundException, ConflictException, ForbiddenException, BadRequestException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import { type CreateAssetInput, type UpdateMintStatusInput, type AssetResponse, formatAssetResponse } from "../dtos/asset.dto";
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
    const existingAsset = existing[0];

    // If asset is already minted, reject
    if (existingAsset.mintStatus === "MINTED") {
      throw new ConflictException("Asset already exists and is minted");
    }

    // If asset is pending but created by different user, reject
    if (existingAsset.createdBy.toLowerCase() !== authUser.address.toLowerCase()) {
      throw new ForbiddenException("Asset is pending mint by another user");
    }

    // Asset is pending and same user - update it (retry scenario)
    // Include assetId in hash to ensure uniqueness even with identical metadata
    const metadata = {
      assetId: input.assetId,
      manufacturer: input.manufacturer,
      model: input.model,
      serialNumber: input.serialNumber,
      manufacturedDate: input.manufacturedDate,
      description: input.description,
    };

    const dataHash = calculateHash(metadata);

    const updated = await db
      .update(assets)
      .set({
        dataHash,
        manufacturer: input.manufacturer,
        model: input.model,
        serialNumber: input.serialNumber,
        manufacturedDate: input.manufacturedDate,
        description: input.description || null,
        images: input.images || [],
        metadata: input.metadata || null,
        mintStatus: "PENDING",
        txHash: null,
        mintedAt: null,
      })
      .where(eq(assets.assetId, input.assetId))
      .returning();

    return createSuccessResponse(
      formatAssetResponse(updated[0]),
      "Asset updated for retry"
    );
  }

  // Calculate data hash (include assetId to ensure uniqueness even with identical metadata)
  const metadata = {
    assetId: input.assetId,
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
      mintStatus: "PENDING",
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

export async function updateMintStatus(
  assetId: number,
  input: UpdateMintStatusInput,
  authUser: AuthUser
): Promise<SuccessResponse<AssetResponse>> {
  // Find asset
  const existing = await db
    .select()
    .from(assets)
    .where(eq(assets.assetId, assetId))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  const asset = existing[0];

  // Only creator can update status
  if (asset.createdBy.toLowerCase() !== authUser.address.toLowerCase()) {
    throw new ForbiddenException("Only the creator can update mint status");
  }

  // Can only update from PENDING status
  if (asset.mintStatus !== "PENDING") {
    throw new BadRequestException(`Cannot update status from ${asset.mintStatus}`);
  }

  // Update the asset
  const updated = await db
    .update(assets)
    .set({
      mintStatus: input.status,
      txHash: input.status === "MINTED" ? input.txHash : null,
      mintedAt: input.status === "MINTED" ? new Date() : null,
    })
    .where(eq(assets.assetId, assetId))
    .returning();

  return createSuccessResponse(
    formatAssetResponse(updated[0]),
    `Asset mint status updated to ${input.status}`
  );
}
