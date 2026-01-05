/**
 * Reset database tables for fresh start
 * Run with: npx tsx src/db/reset.ts
 */

import { db } from "./index";
import { assets, evidence, serviceRecordsProviderA, processedServiceRecords, authNonces } from "./schema";

async function reset() {
    console.log("🗑️  Resetting database tables...\n");

    try {
        // Delete in order (respect foreign keys)
        console.log("  Deleting processed_service_records...");
        await db.delete(processedServiceRecords);

        console.log("  Deleting service_records_provider_a...");
        await db.delete(serviceRecordsProviderA);

        console.log("  Deleting evidence...");
        await db.delete(evidence);

        console.log("  Deleting assets...");
        await db.delete(assets);

        console.log("  Deleting auth_nonces...");
        await db.delete(authNonces);

        console.log("\n✅ Database reset complete!");
        console.log("   All tables have been cleared.");
    } catch (error) {
        console.error("❌ Error resetting database:", error);
        process.exit(1);
    }

    process.exit(0);
}

reset();
