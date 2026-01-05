/**
 * Data Migration Script
 * Migrates data from old schema to new schema.
 *
 * This script should be run AFTER db:push has applied the schema changes.
 *
 * Changes:
 * 1. service_records → service_records_provider_a (schema changes)
 * 2. verification_requests → processed_service_records (table replaced)
 *
 * Run with: npx tsx src/db/migrate-data.ts
 */

import { db } from "./index";
import { sql } from "drizzle-orm";

// Map old serviceType to new eventType
const SERVICE_TYPE_MAP: Record<string, string> = {
  "ROUTINE_MAINTENANCE": "MAINTENANCE",
  "PREVENTIVE_MAINTENANCE": "MAINTENANCE",
  "REPAIR": "MAINTENANCE",
  "INSPECTION": "VERIFICATION",
  "APPRAISAL": "VERIFICATION",
  "WARRANTY_CLAIM": "WARRANTY",
  "CERTIFICATION": "CERTIFICATION",
};

// Map old serviceType to eventName
const SERVICE_TYPE_NAME_MAP: Record<string, string> = {
  "ROUTINE_MAINTENANCE": "Routine Maintenance",
  "PREVENTIVE_MAINTENANCE": "Preventive Maintenance",
  "REPAIR": "Repair Service",
  "INSPECTION": "Inspection",
  "APPRAISAL": "Appraisal",
  "WARRANTY_CLAIM": "Warranty Claim",
  "CERTIFICATION": "Certification",
};

async function migrateData() {
  console.log("🔄 Starting data migration...\n");

  try {
    // Check if old tables exist
    const oldTablesExist = await checkOldTablesExist();

    if (!oldTablesExist.serviceRecords && !oldTablesExist.verificationRequests) {
      console.log("ℹ️  No old tables found. Nothing to migrate.");
      console.log("   This is expected for fresh installations.");
      process.exit(0);
    }

    // Migration 1: Migrate service_records to service_records_provider_a
    if (oldTablesExist.serviceRecords) {
      await migrateServiceRecords();
    }

    // Migration 2: Migrate verification_requests to processed_service_records
    if (oldTablesExist.verificationRequests) {
      await migrateVerificationRequests();
    }

    console.log("\n✅ Data migration complete!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

async function checkOldTablesExist(): Promise<{
  serviceRecords: boolean;
  verificationRequests: boolean;
}> {
  // Check if old service_records table exists with old schema
  let serviceRecords = false;
  let verificationRequests = false;

  try {
    const srCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'service_records' AND column_name = 'service_type'
    `);
    serviceRecords = srCheck.length > 0;
  } catch {
    serviceRecords = false;
  }

  try {
    const vrCheck = await db.execute(sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'verification_requests'
    `);
    verificationRequests = vrCheck.length > 0;
  } catch {
    verificationRequests = false;
  }

  return { serviceRecords, verificationRequests };
}

async function migrateServiceRecords() {
  console.log("📦 Migrating service_records...");

  // Get all records from old table
  const oldRecords = await db.execute<{
    id: number;
    record_id: string;
    asset_id: number;
    provider_id: string;
    service_type: string;
    service_date: string;
    technician: string | null;
    work_performed: string[] | null;
    notes: string | null;
    verified: boolean;
    created_at: Date;
  }>(sql`SELECT * FROM service_records`);

  if (oldRecords.length === 0) {
    console.log("   No records to migrate.");
    return;
  }

  console.log(`   Found ${oldRecords.length} records to migrate.`);

  // Insert into new table
  for (const record of oldRecords) {
    const eventType = SERVICE_TYPE_MAP[record.service_type] || "MAINTENANCE";
    const eventName = SERVICE_TYPE_NAME_MAP[record.service_type] || record.service_type;

    await db.execute(sql`
      INSERT INTO service_records_provider_a (
        record_id, asset_id, provider_id, event_type, event_name,
        service_date, technician_name, technician_notes, work_performed,
        verified, created_at
      )
      VALUES (
        ${record.record_id},
        ${record.asset_id},
        ${record.provider_id},
        ${eventType},
        ${eventName},
        ${record.service_date},
        ${record.technician},
        ${record.notes},
        ${JSON.stringify(record.work_performed)},
        ${record.verified},
        ${record.created_at}
      )
      ON CONFLICT (record_id) DO NOTHING
    `);
  }

  console.log(`   ✓ Migrated ${oldRecords.length} service records.`);

  // Optionally drop old table (commented out for safety)
  // await db.execute(sql`DROP TABLE IF EXISTS service_records`);
  // console.log("   ✓ Dropped old service_records table.");
}

async function migrateVerificationRequests() {
  console.log("📦 Migrating verification_requests...");

  // Get all records from old table
  const oldRequests = await db.execute<{
    id: number;
    request_id: string;
    asset_id: number;
    requester_address: string;
    service_record_id: number | null;
    evidence_id: number | null;
    tx_hash: string | null;
    blockchain_event_id: number | null;
    status: string;
    error_message: string | null;
    created_at: Date;
    processed_at: Date | null;
  }>(sql`SELECT * FROM verification_requests`);

  if (oldRequests.length === 0) {
    console.log("   No requests to migrate.");
    return;
  }

  console.log(`   Found ${oldRequests.length} requests to migrate.`);

  // For completed requests with service_record_id, create processed_service_records entry
  for (const request of oldRequests) {
    if (request.service_record_id && request.status === "COMPLETED") {
      // Get the new service record ID from the migrated table
      const newRecord = await db.execute<{ id: number }>(sql`
        SELECT id FROM service_records_provider_a
        WHERE id = ${request.service_record_id}
        LIMIT 1
      `);

      if (newRecord.length > 0) {
        await db.execute(sql`
          INSERT INTO processed_service_records (
            service_record_id, provider_id, status,
            evidence_id, blockchain_event_id, tx_hash,
            created_at, processed_at
          )
          SELECT
            ${newRecord[0].id},
            provider_id,
            'COMPLETED',
            ${request.evidence_id},
            ${request.blockchain_event_id},
            ${request.tx_hash},
            ${request.created_at},
            ${request.processed_at}
          FROM service_records_provider_a
          WHERE id = ${newRecord[0].id}
          ON CONFLICT DO NOTHING
        `);
      }
    }
  }

  console.log(`   ✓ Migrated completed verification requests.`);

  // Optionally drop old table (commented out for safety)
  // await db.execute(sql`DROP TABLE IF EXISTS verification_requests`);
  // console.log("   ✓ Dropped old verification_requests table.");
}

migrateData();
