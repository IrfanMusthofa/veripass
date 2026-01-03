import { ethers } from "ethers";
import { submitVerifiedEvent, oracleWallet } from "./blockchain";
import { backendClient } from "./backend-client";
import type { VerificationRequestResponse } from "../dtos/verification.dto";

export async function processVerificationRequest(request: VerificationRequestResponse): Promise<void> {
  console.log(`\n🔍 Processing request: ${request.requestId}`);

  try {
    // Update status to PROCESSING
    await backendClient.updateRequest(request.requestId, { status: "PROCESSING" });

    // Fetch service records
    const records = await backendClient.getServiceRecords(request.assetId);

    if (records.length === 0) {
      throw new Error("No service records found");
    }

    console.log(`✅ Found ${records.length} service record(s)`);

    // Validate records
    const isValid = records.every((r) => r.verified === true);
    if (!isValid) {
      throw new Error("Service records validation failed");
    }

    // Prepare evidence data
    const evidenceData = {
      assetId: request.assetId,
      eventType: "VERIFICATION",
      eventDate: new Date().toISOString().split("T")[0],
      providerId: request.providerId,
      providerName: records[0].providerId,
      description: `Oracle verified service records`,
      metadata: {
        serviceRecords: records.map((r) => ({
          recordId: r.recordId,
          serviceType: r.serviceType,
          serviceDate: r.serviceDate,
        })),
        verifiedBy: oracleWallet.address,
      },
    };

    // Create evidence
    const evidence = await backendClient.createEvidence(evidenceData);
    console.log(`📄 Evidence created: ${evidence.id}`);

    // Create hash and signature
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidenceData)));
    const signature = await oracleWallet.signMessage(ethers.getBytes(dataHash));

    // Submit to blockchain
    const result = await submitVerifiedEvent(request.assetId, dataHash, signature);

    // Update request to COMPLETED
    await backendClient.updateRequest(request.requestId, {
      status: "COMPLETED",
      blockchainEventId: result.eventId,
      txHash: result.txHash,
      dataHash: evidence.dataHash,
      evidenceId: evidence.id,
    });

    console.log(`✅ Verification completed: ${request.requestId}`);
  } catch (error) {
    console.error(`❌ Verification failed:`, error);

    await backendClient.updateRequest(request.requestId, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
