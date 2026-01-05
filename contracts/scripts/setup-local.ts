/**
 * Full local setup script
 * Deploys contracts, registers oracle, adds minter, and outputs env vars
 * 
 * Run with: npx hardhat run scripts/setup-local.ts --network localhost
 */

import { ethers } from "hardhat";

async function main() {
    console.log("🚀 VeriPass Local Setup Starting...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deployer account:", deployer.address);
    console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // ============================================================
    // STEP 1: Deploy contracts
    // ============================================================
    console.log("📦 STEP 1: Deploying contracts...\n");

    // Deploy AssetPassport
    const AssetPassport = await ethers.getContractFactory("AssetPassport");
    const assetPassport = await AssetPassport.deploy();
    await assetPassport.waitForDeployment();
    const assetPassportAddress = await assetPassport.getAddress();
    console.log("✅ AssetPassport deployed to:", assetPassportAddress);

    // Deploy EventRegistry
    const EventRegistry = await ethers.getContractFactory("EventRegistry");
    const eventRegistry = await EventRegistry.deploy();
    await eventRegistry.waitForDeployment();
    const eventRegistryAddress = await eventRegistry.getAddress();
    console.log("✅ EventRegistry deployed to:", eventRegistryAddress);

    // Wire them together
    await eventRegistry.setAssetPassport(assetPassportAddress);
    console.log("✅ Contracts wired together\n");

    // ============================================================
    // STEP 2: Register Oracle
    // ============================================================
    console.log("🔐 STEP 2: Registering Oracle...\n");

    const oracleAddress = deployer.address; // Account #0 is oracle
    const isOracleBefore = await eventRegistry.isTrustedOracle(oracleAddress);
    if (!isOracleBefore) {
        await eventRegistry.addTrustedOracle(oracleAddress);
        console.log("✅ Oracle registered:", oracleAddress);
    } else {
        console.log("ℹ️  Oracle already registered:", oracleAddress);
    }

    // ============================================================
    // STEP 3: Add Minter
    // ============================================================
    console.log("\n🎫 STEP 3: Adding Minter...\n");

    const minterAddress = deployer.address; // Account #0 is minter
    const isMinterBefore = await assetPassport.isAuthorizedMinter(minterAddress);
    if (!isMinterBefore) {
        await assetPassport.addAuthorizedMinter(minterAddress);
        console.log("✅ Minter authorized:", minterAddress);
    } else {
        console.log("ℹ️  Minter already authorized:", minterAddress);
    }

    // ============================================================
    // OUTPUT: Environment variables
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("📋 UPDATE YOUR .env FILES WITH THESE VALUES:");
    console.log("=".repeat(60) + "\n");

    console.log("# contracts/.env & backend/.env");
    console.log(`ASSET_PASSPORT_ADDRESS=${assetPassportAddress}`);
    console.log(`EVENT_REGISTRY_ADDRESS=${eventRegistryAddress}`);
    console.log("");
    console.log("# frontend/.env");
    console.log(`VITE_ASSET_PASSPORT_ADDRESS=${assetPassportAddress}`);
    console.log(`VITE_EVENT_REGISTRY_ADDRESS=${eventRegistryAddress}`);
    console.log("\n" + "=".repeat(60));
    console.log("✅ Local setup complete!");
    console.log("=".repeat(60) + "\n");

    console.log("📌 Next steps:");
    console.log("   1. Update your .env files with the addresses above");
    console.log("   2. Run: cd ../backend && npm run db:reset");
    console.log("   3. Restart backend and frontend if needed");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });
