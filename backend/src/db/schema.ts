import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  bigint,
  boolean,
  jsonb,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";

// ============================================================
// ASSETS TABLE
// ============================================================
// Note: `id` is the database primary key (auto-increment for internal use)
//       `assetId` is the blockchain asset ID that matches the smart contract

export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),

    // Must match smart contract
    assetId: bigint("asset_id", { mode: "number" }).notNull().unique(),
    dataHash: varchar("data_hash", { length: 66 }).notNull().unique(),

    // Asset metadata (gets hashed)
    manufacturer: varchar("manufacturer", { length: 255 }).notNull(),
    model: varchar("model", { length: 255 }).notNull(),
    serialNumber: varchar("serial_number", { length: 255 }).notNull(),
    manufacturedDate: varchar("manufactured_date", { length: 10 }), // YYYY-MM-DD
    description: text("description"),

    // Additional data (flexible)
    images: jsonb("images").$type<string[]>(), // Array of image URLs
    metadata: jsonb("metadata").$type<Record<string, unknown>>(), // Any extra fields

    // Tracking
    createdBy: varchar("created_by", { length: 42 }).notNull(), // User wallet address
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("asset_id_idx").on(table.assetId),
    index("data_hash_idx").on(table.dataHash),
  ]
);

// ============================================================
// EVIDENCE TABLE (Event data)
// ============================================================

export const evidence = pgTable(
  "evidence",
  {
    id: serial("id").primaryKey(),

    // Link to asset
    assetId: bigint("asset_id", { mode: "number" }).notNull(),
    dataHash: varchar("data_hash", { length: 66 }).notNull().unique(),

    // Event details (gets hashed)
    eventType: varchar("event_type", { length: 20 }).notNull(), // MAINTENANCE, VERIFICATION, etc.
    eventDate: varchar("event_date", { length: 10 }), // YYYY-MM-DD
    providerId: varchar("provider_id", { length: 255 }),
    providerName: varchar("provider_name", { length: 255 }),
    description: text("description"),

    // Additional data (flexible)
    files: jsonb("files").$type<Array<{ url: string; type: string; name: string }>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Verification tracking
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedBy: varchar("verified_by", { length: 42 }), // Oracle address
    blockchainEventId: bigint("blockchain_event_id", { mode: "number" }),
    txHash: varchar("tx_hash", { length: 66 }),

    // Tracking
    createdBy: varchar("created_by", { length: 42 }).notNull(), // User wallet address
    createdAt: timestamp("created_at").defaultNow().notNull(),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => [
    index("evidence_asset_id_idx").on(table.assetId),
    index("evidence_data_hash_idx").on(table.dataHash),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.assetId],
      name: "evidence_asset_id_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

// ============================================================
// SERVICE PROVIDERS (Dummy data for oracle)
// ============================================================

export const serviceProviders = pgTable("service_providers", {
  id: serial("id").primaryKey(),
  providerId: varchar("provider_id", { length: 255 }).notNull().unique(),
  providerName: varchar("provider_name", { length: 255 }).notNull(),
  providerType: varchar("provider_type", { length: 50 }).notNull(), // manufacturer, service_center, inspector
  isTrusted: boolean("is_trusted").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// SERVICE RECORDS (Dummy data that oracle fetches)
// ============================================================
// Note: `id` is the database primary key (auto-increment for internal use)
//       `recordId` is the business identifier (e.g., "SR-001")

export const serviceRecords = pgTable(
  "service_records",
  {
    id: serial("id").primaryKey(),
    recordId: varchar("record_id", { length: 255 }).notNull().unique(),

    assetId: bigint("asset_id", { mode: "number" }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),

    serviceType: varchar("service_type", { length: 50 }).notNull(), // ROUTINE_MAINTENANCE, REPAIR, etc.
    serviceDate: varchar("service_date", { length: 10 }).notNull(), // YYYY-MM-DD
    technician: varchar("technician", { length: 255 }),

    // Work details
    workPerformed: jsonb("work_performed").$type<string[]>(),
    notes: text("notes"),

    verified: boolean("verified").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("service_records_asset_id_idx").on(table.assetId),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.assetId],
      name: "service_records_asset_id_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

// ============================================================
// VERIFICATION REQUESTS (Oracle queue)
// ============================================================
// Note: `id` is the database primary key (auto-increment for internal use)
//       `requestId` is the business identifier (e.g., "VR-1704278400000-abc123def")

export const verificationRequests = pgTable(
  "verification_requests",
  {
    id: serial("id").primaryKey(),
    requestId: varchar("request_id", { length: 50 }).notNull().unique(),

    assetId: bigint("asset_id", { mode: "number" }).notNull(),
    requestType: varchar("request_type", { length: 50 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }),
    requestedBy: varchar("requested_by", { length: 42 }).notNull(), // User address

    // Status: PENDING, PROCESSING, COMPLETED, FAILED
    status: varchar("status", { length: 20 }).default("PENDING").notNull(),

    // Result
    blockchainEventId: bigint("blockchain_event_id", { mode: "number" }),
    txHash: varchar("tx_hash", { length: 66 }),
    dataHash: varchar("data_hash", { length: 66 }),
    evidenceId: bigint("evidence_id", { mode: "number" }),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("verification_requests_status_idx").on(table.status),
    index("verification_requests_asset_id_idx").on(table.assetId),
    index("verification_requests_evidence_id_idx").on(table.evidenceId),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.assetId],
      name: "verification_requests_asset_id_fk",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.evidenceId],
      foreignColumns: [evidence.id],
      name: "verification_requests_evidence_id_fk",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
);

// ============================================================
// AUTH NONCES (Web3 authentication)
// ============================================================

export const authNonces = pgTable(
  "auth_nonces",
  {
    id: serial("id").primaryKey(),
    address: varchar("address", { length: 42 }).notNull().unique(),
    nonce: varchar("nonce", { length: 66 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("auth_nonces_address_idx").on(table.address),
  ]
);

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;

export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type NewServiceProvider = typeof serviceProviders.$inferInsert;

export type ServiceRecord = typeof serviceRecords.$inferSelect;
export type NewServiceRecord = typeof serviceRecords.$inferInsert;

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type NewVerificationRequest = typeof verificationRequests.$inferInsert;

export type AuthNonce = typeof authNonces.$inferSelect;
export type NewAuthNonce = typeof authNonces.$inferInsert;
