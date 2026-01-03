import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { config } from "../lib/config";

// Create postgres client
const client = postgres(config.database.url, {
  max: 10, // maximum number of connections in the pool
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export all schema items for convenience
export * from "./schema";
