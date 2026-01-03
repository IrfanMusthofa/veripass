import { db } from "../db";
import { serviceRecords } from "../db/schema";
import { eq } from "drizzle-orm";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import type { ServiceRecordData } from "../types";

export async function getServiceRecordsByAssetId(assetId: number): Promise<SuccessResponse<ServiceRecordData[]>> {
  const results = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.assetId, assetId));

  const records = results.map((record) => ({
    recordId: record.recordId,
    assetId: record.assetId,
    providerId: record.providerId,
    serviceType: record.serviceType,
    serviceDate: record.serviceDate,
    technician: record.technician || undefined,
    workPerformed: (record.workPerformed as string[]) || undefined,
    notes: record.notes || undefined,
    verified: record.verified,
  }));

  return createSuccessResponse(records, "Service records retrieved successfully");
}
