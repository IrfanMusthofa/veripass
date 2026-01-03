import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the configuration schema
const configSchema = z.object({
  // Server configuration
  port: z.coerce.number().int().positive().default(3000),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),

  // Database configuration
  database: z.object({
    url: z.string(),
  }),

  // JWT configuration
  jwt: z.object({
    secret: z
      .string()
      .min(32, "JWT secret must be at least 32 characters for security"),
    expiresIn: z.string().default("7d"),
  }),

  // CORS
  frontendUrl: z.string().url(),

  // Oracle configuration
  oracle: z.object({
    apiKey: z.string().min(32, "Oracle API key must be at least 32 characters"),
    privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Oracle private key must be a valid 64-char hex with 0x prefix").optional(),
    pollInterval: z.coerce.number().int().positive().default(30000),
  }),

  // Blockchain configuration
  blockchain: z.object({
    sepoliaRpcUrl: z.string().url(),
    assetPassportAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    eventRegistryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  }),
});

// Parse and validate environment variables
const parseConfig = () => {
  const rawConfig = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    database: {
      url: process.env.DB_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
    frontendUrl: process.env.FRONTEND_URL,
    oracle: {
      apiKey: process.env.ORACLE_API_KEY,
      privateKey: process.env.ORACLE_PRIVATE_KEY,
      pollInterval: process.env.POLL_INTERVAL,
    },
    blockchain: {
      sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL,
      assetPassportAddress: process.env.ASSET_PASSPORT_ADDRESS || "0xE515A68227b1471C61c6b012eB0d450c08392d36",
      eventRegistryAddress: process.env.EVENT_REGISTRY_ADDRESS || "0x2d389a0fc6A3d86eF3C94FaCf2F252EDfB3265e9",
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid configuration:");
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export validated configuration
export const config = parseConfig();

// Export the configuration type
export type Config = z.infer<typeof configSchema>;
