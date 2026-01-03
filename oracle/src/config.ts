import dotenv from "dotenv";

dotenv.config();

export const config = {
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || "",
  oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY || "",
  backendApiUrl: process.env.BACKEND_API_URL || "http://localhost:3000",
  oracleApiKey: process.env.ORACLE_API_KEY || "",
  pollInterval: parseInt(process.env.POLL_INTERVAL || "30000"),
  assetPassportAddress: "0xE515A68227b1471C61c6b012eB0d450c08392d36",
  eventRegistryAddress: "0x2d389a0fc6A3d86eF3C94FaCf2F252EDfB3265e9",
};

// Validate config
if (!config.sepoliaRpcUrl || !config.oraclePrivateKey || !config.oracleApiKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}
