/**
 * Deploy and setup VeriPass on Sepolia Testnet
 * 
 * Run with: npx hardhat run scripts/setup-sepolia.ts --network sepolia
 */

import { ethers } from "hardhat";

async function main() {
    console.log("🚀 VeriPass Sepolia Deployment Starting...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deployer account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");

    if (parseFloat(ethers.formatEther(balance)) < 0.01) {
        console.error("\n❌ Insufficient balance! You need at least 0.01 Sepolia ETH");
        console.error("   Get Sepolia ETH from: https://sepoliafaucet.com");
        process.exit(1);
    }
    console.log("\n");

    // ============================================================
    // STEP 1: Deploy contracts
    // ============================================================
    console.log("📦 STEP 1: Deploying contracts...\n");

    // Deploy AssetPassport
    console.log("  Deploying AssetPassport...");
    const AssetPassport = await ethers.getContractFactory("AssetPassport");
    const assetPassport = await AssetPassport.deploy();
    await assetPassport.waitForDeployment();
    const assetPassportAddress = await assetPassport.getAddress();
    console.log("  ✅ AssetPassport deployed to:", assetPassportAddress);

    // Deploy EventRegistry
    console.log("  Deploying EventRegistry...");
    const EventRegistry = await ethers.getContractFactory("EventRegistry");
    const eventRegistry = await EventRegistry.deploy();
    await eventRegistry.waitForDeployment();
    const eventRegistryAddress = await eventRegistry.getAddress();
    console.log("  ✅ EventRegistry deployed to:", eventRegistryAddress);

    // Wire them together
    console.log("  Wiring contracts...");
    const wireTx = await eventRegistry.setAssetPassport(assetPassportAddress);
    await wireTx.wait();
    console.log("  ✅ Contracts wired together\n");

    // ============================================================
    // STEP 2: Register Oracle (deployer as oracle for now)
    // ============================================================
    console.log("🔐 STEP 2: Registering Oracle...\n");

    const oracleAddress = deployer.address;
    console.log("  Adding deployer as oracle...");
    const oracleTx = await eventRegistry.addTrustedOracle(oracleAddress);
    await oracleTx.wait();
    console.log("  ✅ Oracle registered:", oracleAddress);

    // ============================================================
    // STEP 3: Add Minter (deployer as minter for now)
    // ============================================================
    console.log("\n🎫 STEP 3: Adding Minter...\n");

    const minterAddress = deployer.address;
    console.log("  Adding deployer as minter...");
    const minterTx = await assetPassport.addAuthorizedMinter(minterAddress);
    await minterTx.wait();
    console.log("  ✅ Minter authorized:", minterAddress);

    // ============================================================
    // OUTPUT: Environment variables
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETE! UPDATE YOUR .env FILES:");
    console.log("=".repeat(70) + "\n");

    console.log("# contracts/.env & backend/.env");
    console.log(`ASSET_PASSPORT_ADDRESS=${assetPassportAddress}`);
    console.log(`EVENT_REGISTRY_ADDRESS=${eventRegistryAddress}`);
    console.log("");
    console.log("# frontend/.env");
    console.log(`VITE_ASSET_PASSPORT_ADDRESS=${assetPassportAddress}`);
    console.log(`VITE_EVENT_REGISTRY_ADDRESS=${eventRegistryAddress}`);
    console.log("");
    console.log("# backend/.env (for oracle)");
    console.log(`SEPOLIA_RPC_URL=${process.env.SEPOLIA_RPC_URL}`);
    console.log(`ORACLE_PRIVATE_KEY=${process.env.DEPLOYER_PRIVATE_KEY}`);

    console.log("\n" + "=".repeat(70));
    console.log("📝 View on Etherscan:");
    console.log(`   AssetPassport: https://sepolia.etherscan.io/address/${assetPassportAddress}`);
    console.log(`   EventRegistry: https://sepolia.etherscan.io/address/${eventRegistryAddress}`);
    console.log("=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
