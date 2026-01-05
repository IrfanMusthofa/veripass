import { ethers } from "ethers";
import { submitVerifiedEvent, oracleWallet } from "./blockchain";
import {
  createProcessedRecord,
  completeProcessedRecord,
  failProcessedRecord,
  createOracleEvidence,
  getProviderName,
} from "./backend-client";
import { calculateHash } from "../lib/hash";
import type { ServiceRecordProviderA } from "../db/schema";

/**
 * Process a service record from a provider.
 * Creates evidence and records it on the blockchain as a verified event.
 */
export async function processServiceRecord(
  record: ServiceRecordProviderA
): Promise<void> {
  console.log(`\n🔍 Processing service record: ${record.recordId}`);
  console.log(`   Event: ${record.eventType} - ${record.eventName}`);

  let processedRecordId: number | null = null;

  try {
    // Create processing entry
    processedRecordId = await createProcessedRecord(record.id, record.providerId);

    // Validate record is verified by provider
    if (!record.verified) {
      throw new Error("Service record is not verified by provider");
    }

    // Get provider name for display
    const providerName = await getProviderName(record.providerId);

    // Build evidence data
    const eventData: Record<string, unknown> = {
      eventName: record.eventName,
      technicianName: record.technicianName,
      technicianNotes: record.technicianNotes,
      workPerformed: record.workPerformed,
      partsReplaced: record.partsReplaced,
      serviceRecordId: record.recordId,
      verifiedBy: oracleWallet.address,
    };

    // Build hash data (same structure as frontend calculateHash)
    const hashData = {
      assetId: Number(record.assetId),
      eventType: record.eventType,
      eventDate: record.serviceDate,
      providerName: providerName,
      description: `${record.eventName} - ${record.technicianNotes || "Service completed"}`,
      notes: record.technicianNotes || "",
      eventData,
    };

    // Calculate deterministic hash
    const dataHash = calculateHash(hashData);
    console.log(`   Hash: ${dataHash.substring(0, 18)}...`);

    // Sign the hash
    const signature = await oracleWallet.signMessage(ethers.getBytes(dataHash));

    // Submit to blockchain with correct event type
    console.log(`   Submitting to blockchain...`);
    const result = await submitVerifiedEvent(
      Number(record.assetId),
      record.eventType,
      dataHash,
      signature
    );
    console.log(`   TX: ${result.txHash.substring(0, 18)}...`);

    // Create evidence in database
    const evidenceId = await createOracleEvidence({
      assetId: Number(record.assetId),
      serviceRecordId: record.id,
      eventType: record.eventType,
      eventDate: record.serviceDate,
      providerName,
      description: `${record.eventName} - ${record.technicianNotes || "Service completed"}`,
      eventData,
      dataHash,
      txHash: result.txHash,
      blockchainEventId: result.eventId,
      oracleAddress: oracleWallet.address,
    });

    // Update processed record to COMPLETED
    await completeProcessedRecord(processedRecordId, {
      evidenceId,
      blockchainEventId: result.eventId,
      txHash: result.txHash,
    });

    console.log(`✅ Service record processed: ${record.recordId}`);
    console.log(`   Evidence ID: ${evidenceId}`);
    console.log(`   Blockchain Event ID: ${result.eventId}`);
  } catch (error) {
    console.error(`❌ Processing failed:`, error);

    if (processedRecordId) {
      await failProcessedRecord(
        processedRecordId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
}
