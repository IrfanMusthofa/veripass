/**
 * Add Authorized Minter and Trusted Oracle
 *
 * This script adds an address as both an authorized minter (AssetPassport)
 * and a trusted oracle (EventRegistry).
 *
 * Usage:
 *   npx hardhat run scripts/add-authorized.ts --network <network>
 *
 * Environment variables required:
 *   ASSET_PASSPORT_ADDRESS - Deployed AssetPassport contract address
 *   EVENT_REGISTRY_ADDRESS - Deployed EventRegistry contract address
 *
 * The address to authorize will be prompted interactively.
 *
 * Examples:
 *   # Run on localhost
 *   npx hardhat run scripts/add-authorized.ts --network localhost
 *
 *   # Run on Sepolia
 *   npx hardhat run scripts/add-authorized.ts --network sepolia
 */

import { ethers } from "hardhat";
import * as readline from "readline";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("\n🔐 VeriPass: Add Authorized Minter & Trusted Oracle\n");
  console.log("=".repeat(60));

  // Get contract addresses from environment
  const assetPassportAddress = process.env.ASSET_PASSPORT_ADDRESS;
  const eventRegistryAddress = process.env.EVENT_REGISTRY_ADDRESS;

  // Validate contract addresses
  if (!assetPassportAddress) {
    throw new Error(
      "Missing ASSET_PASSPORT_ADDRESS environment variable.\n" +
        "Set it with: export ASSET_PASSPORT_ADDRESS=0x..."
    );
  }

  if (!eventRegistryAddress) {
    throw new Error(
      "Missing EVENT_REGISTRY_ADDRESS environment variable.\n" +
        "Set it with: export EVENT_REGISTRY_ADDRESS=0x..."
    );
  }

  // Prompt for address to authorize
  const addressToAuthorize = await prompt(
    "Enter address to authorize (0x...): "
  );

  if (!addressToAuthorize) {
    throw new Error("No address provided.");
  }

  // Validate address format
  if (!ethers.isAddress(addressToAuthorize)) {
    throw new Error(`Invalid address format: ${addressToAuthorize}`);
  }

  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  console.log("Address to authorize:", addressToAuthorize);
  console.log("AssetPassport:", assetPassportAddress);
  console.log("EventRegistry:", eventRegistryAddress);
  console.log("=".repeat(60) + "\n");

  // Get contract instances
  const assetPassport = await ethers.getContractAt(
    "AssetPassport",
    assetPassportAddress
  );
  const eventRegistry = await ethers.getContractAt(
    "EventRegistry",
    eventRegistryAddress
  );

  // Check ownership
  const passportOwner = await assetPassport.owner();
  const registryOwner = await eventRegistry.owner();

  if (passportOwner !== signer.address) {
    throw new Error(
      `Signer (${signer.address}) is not the owner of AssetPassport (owner: ${passportOwner})`
    );
  }

  if (registryOwner !== signer.address) {
    throw new Error(
      `Signer (${signer.address}) is not the owner of EventRegistry (owner: ${registryOwner})`
    );
  }

  // ============================================================
  // Add Authorized Minter
  // ============================================================
  console.log("📝 Adding Authorized Minter...");

  const isMinterAlready = await assetPassport.isAuthorizedMinter(
    addressToAuthorize
  );

  if (isMinterAlready) {
    console.log("   ℹ️  Already an authorized minter, skipping.\n");
  } else {
    const minterTx = await assetPassport.addAuthorizedMinter(addressToAuthorize);
    await minterTx.wait();
    console.log("   ✅ Added as authorized minter");
    console.log(`   📄 Transaction: ${minterTx.hash}\n`);
  }

  // ============================================================
  // Add Trusted Oracle
  // ============================================================
  console.log("📝 Adding Trusted Oracle...");

  const isOracleAlready = await eventRegistry.isTrustedOracle(addressToAuthorize);

  if (isOracleAlready) {
    console.log("   ℹ️  Already a trusted oracle, skipping.\n");
  } else {
    const oracleTx = await eventRegistry.addTrustedOracle(addressToAuthorize);
    await oracleTx.wait();
    console.log("   ✅ Added as trusted oracle");
    console.log(`   📄 Transaction: ${oracleTx.hash}\n`);
  }

  // ============================================================
  // Verify final state
  // ============================================================
  console.log("=".repeat(60));
  console.log("📋 Final Status:");
  console.log("=".repeat(60));

  const finalMinterStatus = await assetPassport.isAuthorizedMinter(
    addressToAuthorize
  );
  const finalOracleStatus = await eventRegistry.isTrustedOracle(
    addressToAuthorize
  );

  console.log(`Address: ${addressToAuthorize}`);
  console.log(`  Authorized Minter: ${finalMinterStatus ? "✅ Yes" : "❌ No"}`);
  console.log(`  Trusted Oracle:    ${finalOracleStatus ? "✅ Yes" : "❌ No"}`);
  console.log("\n✅ Done!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message || error);
    process.exit(1);
  });
