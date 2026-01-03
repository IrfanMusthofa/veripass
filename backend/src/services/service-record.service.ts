import { db } from "../db";
import { assets, serviceRecords } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import { type ServiceRecordResponse, formatServiceRecordResponse } from "../dtos/service-record.dto";

export async function getServiceRecordsByAssetId(
  assetId: number
): Promise<SuccessResponse<ServiceRecordResponse[]>> {
  // Validate that asset exists
  const assetExists = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.assetId, assetId))
    .limit(1);

  if (assetExists.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  const results = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.assetId, assetId));

  return createSuccessResponse(
    results.map(formatServiceRecordResponse),
    "Service records retrieved successfully"
  );
}
