import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying with account:", deployer.address);
    console.log(
        "Balance:",
        ethers.formatEther(await deployer.provider.getBalance(deployer.address))
    );

    // 1. Deploy AssetPassport
    const AssetPassport = await ethers.getContractFactory("AssetPassport");
    const assetPassport = await AssetPassport.deploy();
    await assetPassport.waitForDeployment();

    const assetPassportAddress = await assetPassport.getAddress();
    console.log("AssetPassport deployed to:", assetPassportAddress);

    // 2. Deploy EventRegistry
    const EventRegistry = await ethers.getContractFactory("EventRegistry");
    const eventRegistry = await EventRegistry.deploy();
    await eventRegistry.waitForDeployment();

    const eventRegistryAddress = await eventRegistry.getAddress();
    console.log("EventRegistry deployed to:", eventRegistryAddress);

    // 3. Wire contracts (dependency injection)
    const tx = await eventRegistry.setAssetPassport(assetPassportAddress);
    await tx.wait();

    console.log("EventRegistry wired to AssetPassport");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
