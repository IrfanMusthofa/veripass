import { checkOracleRegistration, oracleWallet, provider } from "./blockchain";
import { getUnprocessedServiceRecords } from "./backend-client";
import { processServiceRecord } from "./verifier";
import { config } from "../lib/config";
import { ethers } from "ethers";

export class OracleWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    console.log("🚀 VeriPass Oracle Worker starting...");
    console.log(`📍 Oracle address: ${oracleWallet.address}`);

    // Check registration
    const isRegistered = await checkOracleRegistration();
    if (!isRegistered) {
      console.error("❌ Oracle NOT registered!");
      console.error(`   Ask contract owner to run:`);
      console.error(`   await eventRegistry.addTrustedOracle("${oracleWallet.address}")`);
      process.exit(1);
    }

    console.log("✅ Oracle is registered");

    // Check balance
    const balance = await provider.getBalance(oracleWallet.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
      console.warn("⚠️  Low balance!");
    }

    // Start polling
    this.isRunning = true;
    console.log(`🔄 Polling for service records every ${config.oracle.pollInterval}ms\n`);

    this.poll();
    this.intervalId = setInterval(() => this.poll(), config.oracle.pollInterval);

    process.on("SIGINT", () => this.stop());
    process.on("SIGTERM", () => this.stop());
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      // Get unprocessed service records from database
      const records = await getUnprocessedServiceRecords();

      if (records.length === 0) {
        process.stdout.write(".");
        return;
      }

      console.log(`\n📋 Found ${records.length} unprocessed service record(s)`);

      // Process each record
      for (const record of records) {
        await processServiceRecord(record);
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }

  private stop() {
    console.log("\n🛑 Stopping oracle...");
    this.isRunning = false;
    if (this.intervalId) clearInterval(this.intervalId);
    process.exit(0);
  }
}
