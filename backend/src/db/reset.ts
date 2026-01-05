/**
 * Reset database tables for fresh start
 * Run with: npx tsx src/db/reset.ts
 */

import { db } from "./index";
import { assets, evidence, serviceRecords, verificationRequests, authNonces } from "./schema";

async function reset() {
    console.log("🗑️  Resetting database tables...\n");

    try {
        // Delete in order (respect foreign keys)
        console.log("  Deleting verification_requests...");
        await db.delete(verificationRequests);

        console.log("  Deleting service_records...");
        await db.delete(serviceRecords);

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
