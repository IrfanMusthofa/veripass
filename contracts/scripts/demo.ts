/**
 * Run with: npx hardhat run scripts/demo.ts --network sepolia
 */

import { ethers } from "hardhat";

const ASSET_PASSPORT_ADDRESS = "0xE515A68227b1471C61c6b012eB0d450c08392d36";
const EVENT_REGISTRY_ADDRESS = "0x2d389a0fc6A3d86eF3C94FaCf2F252EDfB3265e9";

enum EventType {
    MAINTENANCE = 0,
    VERIFICATION = 1,
    WARRANTY = 2,
    CERTIFICATION = 3,
    CUSTOM = 4,
}

async function main() {
    console.log("🚀 VeriPass Demo Script Starting...\n");

    // Get the signer (deployer account)
    const [signer] = await ethers.getSigners();
    console.log("📍 Using account:", signer.address);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

    // Connect to deployed contracts
    const assetPassport = await ethers.getContractAt("AssetPassport", ASSET_PASSPORT_ADDRESS);
    const eventRegistry = await ethers.getContractAt("EventRegistry", EVENT_REGISTRY_ADDRESS);

    console.log("📄 Connected to AssetPassport:", ASSET_PASSPORT_ADDRESS);
    console.log("📄 Connected to EventRegistry:", EVENT_REGISTRY_ADDRESS);
    console.log("\n" + "=".repeat(60) + "\n");

    // ============================================================
    // STEP 1: Mint a new Asset Passport
    // ============================================================
    console.log("📦 STEP 1: Minting a new Asset Passport...\n");

    // Create metadata for the asset (in production, this would be stored on IPFS)
    const assetMetadata = {
        name: "Luxury Watch - Rolex Submariner",
        serialNumber: "SN-2024-001234",
        manufacturer: "Rolex",
        manufacturedDate: "2024-01-15",
        description: "Authentic Rolex Submariner with original box and papers"
    };

    // Hash the metadata (this is what gets stored on-chain)
    const metadataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(assetMetadata))
    );

    console.log("📋 Asset Metadata:", JSON.stringify(assetMetadata, null, 2));
    console.log("🔐 Metadata Hash:", metadataHash);

    // Mint the passport to our own address
    const mintTx = await assetPassport.mintPassport(signer.address, metadataHash);
    console.log("\n⏳ Waiting for mint transaction...");
    const mintReceipt = await mintTx.wait();

    // Get the token ID from the event
    const mintEvent = mintReceipt?.logs.find((log: any) => {
        try {
            return assetPassport.interface.parseLog(log)?.name === "PassportMinted";
        } catch {
            return false;
        }
    });

    const parsedMintEvent = assetPassport.interface.parseLog(mintEvent!);
    const tokenId = parsedMintEvent?.args[0];

    console.log("✅ Passport minted successfully!");
    console.log("🎫 Token ID:", tokenId.toString());
    console.log("🔗 TX Hash:", mintReceipt?.hash);
    console.log("\n" + "=".repeat(60) + "\n");

    // ============================================================
    // STEP 2: Record lifecycle events
    // ============================================================
    console.log("📝 STEP 2: Recording lifecycle events...\n");

    // Event 1: Initial certification
    const certificationData = {
        type: "Initial Certification",
        certifier: "Rolex Official Service Center",
        date: "2024-01-15",
        result: "AUTHENTIC",
        notes: "Original product verified with manufacturer database"
    };
    const certDataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(certificationData))
    );

    console.log("📜 Recording CERTIFICATION event...");
    const certTx = await eventRegistry.recordEvent(tokenId, EventType.CERTIFICATION, certDataHash);
    await certTx.wait();
    console.log("   ✅ Certification event recorded");

    // Event 2: Maintenance record
    const maintenanceData = {
        type: "Routine Service",
        serviceCenter: "Rolex Authorized Service",
        date: "2024-06-15",
        workDone: ["Movement cleaning", "Water resistance test", "Crown gasket replacement"],
        nextServiceDate: "2029-06-15"
    };
    const maintDataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(maintenanceData))
    );

    console.log("🔧 Recording MAINTENANCE event...");
    const maintTx = await eventRegistry.recordEvent(tokenId, EventType.MAINTENANCE, maintDataHash);
    await maintTx.wait();
    console.log("   ✅ Maintenance event recorded");

    // Event 3: Warranty registration
    const warrantyData = {
        type: "Warranty Registration",
        warrantyId: "WRN-2024-5678",
        startDate: "2024-01-15",
        endDate: "2029-01-15",
        coverage: "Full manufacturer warranty"
    };
    const warrantyDataHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(warrantyData))
    );

    console.log("🛡️  Recording WARRANTY event...");
    const warrantyTx = await eventRegistry.recordEvent(tokenId, EventType.WARRANTY, warrantyDataHash);
    await warrantyTx.wait();
    console.log("   ✅ Warranty event recorded");

    console.log("\n" + "=".repeat(60) + "\n");

    // ============================================================
    // STEP 3: Retrieve and display asset information
    // ============================================================
    console.log("🔍 STEP 3: Retrieving asset information...\n");

    // Get asset info
    const assetInfo = await assetPassport.getAssetInfo(tokenId);
    console.log("📦 Asset Info:");
    console.log("   - Metadata Hash:", assetInfo.metadataHash);
    console.log("   - Mint Timestamp:", new Date(Number(assetInfo.mintTimestamp) * 1000).toISOString());
    console.log("   - Is Active:", assetInfo.isActive);

    // Get asset owner
    const owner = await assetPassport.ownerOf(tokenId);
    console.log("   - Owner:", owner);

    console.log("\n" + "=".repeat(60) + "\n");

    // ============================================================
    // STEP 4: Retrieve event history
    // ============================================================
    console.log("📜 STEP 4: Retrieving event history...\n");

    // Get all events for the asset
    const events = await eventRegistry.getEventsByAsset(tokenId);

    console.log(`📊 Found ${events.length} events for Token #${tokenId}:\n`);

    const eventTypeNames = ["MAINTENANCE", "VERIFICATION", "WARRANTY", "CERTIFICATION", "CUSTOM"];

    events.forEach((event: any, index: number) => {
        console.log(`   Event #${index + 1}:`);
        console.log(`   - Event ID: ${event.id}`);
        console.log(`   - Type: ${eventTypeNames[event.eventType]}`);
        console.log(`   - Submitter: ${event.submitter}`);
        console.log(`   - Timestamp: ${new Date(Number(event.timestamp) * 1000).toISOString()}`);
        console.log(`   - Data Hash: ${event.dataHash}`);
        console.log();
    });

    // Get event count
    const eventCount = await eventRegistry.getEventCount(tokenId);
    console.log(`📈 Total event count: ${eventCount}`);

    console.log("\n" + "=".repeat(60) + "\n");

    // ============================================================
    // Summary for Frontend Integration
    // ============================================================
    console.log("💡 FRONTEND INTEGRATION SUMMARY:\n");
    console.log("Contracts:");
    console.log(`   AssetPassport: ${ASSET_PASSPORT_ADDRESS}`);
    console.log(`   EventRegistry: ${EVENT_REGISTRY_ADDRESS}`);
    console.log(`\nMinted Token ID: ${tokenId}`);
    console.log("\nKey Functions to Use:");
    console.log("   - assetPassport.mintPassport(to, metadataHash) → Mint new passport");
    console.log("   - assetPassport.getAssetInfo(tokenId) → Get asset details");
    console.log("   - assetPassport.ownerOf(tokenId) → Get owner address");
    console.log("   - eventRegistry.recordEvent(assetId, eventType, dataHash) → Add event");
    console.log("   - eventRegistry.getEventsByAsset(assetId) → Get all events");
    console.log("   - eventRegistry.getEventCount(assetId) → Get event count");

    console.log("\n🎉 Demo completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });
