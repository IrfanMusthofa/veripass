import { db } from "../db";
import {
  serviceRecordsProviderA,
  processedServiceRecords,
  evidence,
  serviceProviders,
} from "../db/schema";
import { eq, isNull } from "drizzle-orm";
import type { ServiceRecordProviderA } from "../db/schema";

/**
 * Get unprocessed service records.
 * Returns service records that don't have a corresponding entry in processed_service_records.
 */
export async function getUnprocessedServiceRecords(): Promise<ServiceRecordProviderA[]> {
  const records = await db
    .select({
      serviceRecord: serviceRecordsProviderA,
    })
    .from(serviceRecordsProviderA)
    .leftJoin(
      processedServiceRecords,
      eq(serviceRecordsProviderA.id, processedServiceRecords.serviceRecordId)
    )
    .where(isNull(processedServiceRecords.id));

  return records.map((r) => r.serviceRecord);
}

/**
 * Create a processed service record entry (PROCESSING status).
 */
export async function createProcessedRecord(
  serviceRecordId: number,
  providerId: string
): Promise<number> {
  const inserted = await db
    .insert(processedServiceRecords)
    .values({
      serviceRecordId,
      providerId,
      status: "PROCESSING",
    })
    .returning({ id: processedServiceRecords.id });

  return inserted[0].id;
}

/**
 * Update processed service record to COMPLETED.
 */
export async function completeProcessedRecord(
  processedRecordId: number,
  data: {
    evidenceId: number;
    blockchainEventId: number;
    txHash: string;
  }
): Promise<void> {
  await db
    .update(processedServiceRecords)
    .set({
      status: "COMPLETED",
      evidenceId: data.evidenceId,
      blockchainEventId: data.blockchainEventId,
      txHash: data.txHash,
      processedAt: new Date(),
    })
    .where(eq(processedServiceRecords.id, processedRecordId));
}

/**
 * Update processed service record to FAILED.
 */
export async function failProcessedRecord(
  processedRecordId: number,
  errorMessage: string
): Promise<void> {
  await db
    .update(processedServiceRecords)
    .set({
      status: "FAILED",
      errorMessage,
      processedAt: new Date(),
    })
    .where(eq(processedServiceRecords.id, processedRecordId));
}

/**
 * Create evidence record for oracle-verified event.
 */
export async function createOracleEvidence(data: {
  assetId: number;
  serviceRecordId: number;
  eventType: string;
  eventDate: string;
  providerName: string;
  description: string;
  eventData: Record<string, unknown>;
  dataHash: string;
  txHash: string;
  blockchainEventId: number;
  oracleAddress: string;
}): Promise<number> {
  const inserted = await db
    .insert(evidence)
    .values({
      assetId: data.assetId,
      serviceRecordId: data.serviceRecordId,
      dataHash: data.dataHash,
      eventType: data.eventType,
      eventDate: data.eventDate,
      providerName: data.providerName,
      description: data.description,
      eventData: data.eventData,
      status: "CONFIRMED",
      isVerified: true,
      verifiedBy: data.oracleAddress,
      txHash: data.txHash,
      blockchainEventId: data.blockchainEventId,
      createdBy: data.oracleAddress,
      confirmedAt: new Date(),
      verifiedAt: new Date(),
    })
    .returning({ id: evidence.id });

  return inserted[0].id;
}

/**
 * Get provider name by provider ID.
 */
export async function getProviderName(providerId: string): Promise<string> {
  const provider = await db
    .select({ providerName: serviceProviders.providerName })
    .from(serviceProviders)
    .where(eq(serviceProviders.providerId, providerId))
    .limit(1);

  return provider.length > 0 ? provider[0].providerName : providerId;
}
