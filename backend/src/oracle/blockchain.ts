import { ethers } from "ethers";
import { config } from "../lib/config";
import EventRegistryABI from "../../../shared/abi/EventRegistry.json";

export const provider = new ethers.JsonRpcProvider(config.blockchain.sepoliaRpcUrl);
export const oracleWallet = new ethers.Wallet(config.oracle.privateKey!, provider);

export const eventRegistry = new ethers.Contract(
  config.blockchain.eventRegistryAddress,
  EventRegistryABI,
  oracleWallet
);

export async function submitVerifiedEvent(
  assetId: number,
  dataHash: string,
  signature: string
): Promise<{ txHash: string; eventId: number }> {
  console.log(`📤 Submitting verified event for asset ${assetId}`);

  const tx = await eventRegistry.recordVerifiedEvent(assetId, dataHash, signature);
  console.log(`⏳ TX sent: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`✅ TX confirmed: ${receipt.hash}`);

  // Extract event ID from logs
  const eventLog = receipt.logs.find((log: unknown) => {
    try {
      const parsed = eventRegistry.interface.parseLog(log as ethers.Log);
      return parsed?.name === "EventRecorded";
    } catch {
      return false;
    }
  });

  let eventId = 0;
  if (eventLog) {
    const parsed = eventRegistry.interface.parseLog(eventLog as ethers.Log);
    eventId = Number(parsed?.args[1]);
  }

  return { txHash: receipt.hash, eventId };
}

export async function checkOracleRegistration(): Promise<boolean> {
  return await eventRegistry.isTrustedOracle(oracleWallet.address);
}
