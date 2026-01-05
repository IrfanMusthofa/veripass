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

    // Mint status: PENDING (waiting for tx), MINTED (confirmed), FAILED (tx failed/cancelled)
    mintStatus: varchar("mint_status", { length: 20 }).default("PENDING").notNull(),
    txHash: varchar("tx_hash", { length: 66 }), // Transaction hash when minted

    // Tracking
    createdBy: varchar("created_by", { length: 42 }).notNull(), // User wallet address
    createdAt: timestamp("created_at").defaultNow().notNull(),
    mintedAt: timestamp("minted_at"),
  },
  (table) => [
    index("asset_id_idx").on(table.assetId),
    index("data_hash_idx").on(table.dataHash),
    index("mint_status_idx").on(table.mintStatus),
  ]
);

// ============================================================
// SERVICE PROVIDERS
// ============================================================

export const serviceProviders = pgTable(
  "service_providers",
  {
    id: serial("id").primaryKey(),
    providerId: varchar("provider_id", { length: 255 }).notNull().unique(),
    providerName: varchar("provider_name", { length: 255 }).notNull(),
    providerType: varchar("provider_type", { length: 50 }).notNull(), // manufacturer, service_center, inspector
    isTrusted: boolean("is_trusted").default(true).notNull(),
    // API key for provider authentication (hashed)
    apiKeyHash: varchar("api_key_hash", { length: 128 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("service_providers_provider_id_idx").on(table.providerId)]
);

// ============================================================
// SERVICE RECORDS (Provider-submitted records)
// ============================================================
// Note: `id` is the database primary key (auto-increment for internal use)
//       `recordId` is the business identifier (e.g., "SR-001")
// This table receives records from external service providers via API

export const serviceRecordsProviderA = pgTable(
  "service_records_provider_a",
  {
    id: serial("id").primaryKey(),
    recordId: varchar("record_id", { length: 255 }).notNull().unique(),

    assetId: bigint("asset_id", { mode: "number" }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),

    // Event classification (provider specifies directly)
    eventType: varchar("event_type", { length: 20 }).notNull(), // MAINTENANCE, VERIFICATION, WARRANTY, CERTIFICATION
    eventName: varchar("event_name", { length: 255 }).notNull(), // "Service RAM", "Battery Replacement", etc.

    // Service details
    serviceDate: varchar("service_date", { length: 10 }).notNull(), // YYYY-MM-DD
    technicianName: varchar("technician_name", { length: 255 }),
    technicianNotes: text("technician_notes"),

    // Work details
    workPerformed: jsonb("work_performed").$type<string[]>(),
    partsReplaced: jsonb("parts_replaced").$type<
      Array<{ name: string; partNumber?: string; quantity?: number }>
    >(),

    // Verification status from provider
    verified: boolean("verified").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("service_records_provider_a_asset_id_idx").on(table.assetId),
    index("service_records_provider_a_provider_id_idx").on(table.providerId),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.assetId],
      name: "service_records_provider_a_asset_id_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

// ============================================================
// PROCESSED SERVICE RECORDS (Oracle processing queue)
// ============================================================
// Tracks which service records have been processed by the oracle

export const processedServiceRecords = pgTable(
  "processed_service_records",
  {
    id: serial("id").primaryKey(),
    serviceRecordId: bigint("service_record_id", { mode: "number" }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),

    // Status: PENDING, PROCESSING, COMPLETED, FAILED
    status: varchar("status", { length: 20 }).default("PENDING").notNull(),

    // Result (populated after processing)
    evidenceId: bigint("evidence_id", { mode: "number" }),
    blockchainEventId: bigint("blockchain_event_id", { mode: "number" }),
    txHash: varchar("tx_hash", { length: 66 }),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [
    index("processed_service_records_status_idx").on(table.status),
    index("processed_service_records_service_record_id_idx").on(
      table.serviceRecordId
    ),
    foreignKey({
      columns: [table.serviceRecordId],
      foreignColumns: [serviceRecordsProviderA.id],
      name: "processed_service_records_service_record_id_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
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

    // Link to service record (for oracle-created evidence)
    serviceRecordId: bigint("service_record_id", { mode: "number" }),

    // Event details
    eventType: varchar("event_type", { length: 20 }).notNull(), // MAINTENANCE, VERIFICATION, WARRANTY, CERTIFICATION, CUSTOM
    eventDate: varchar("event_date", { length: 10 }), // YYYY-MM-DD
    providerName: varchar("provider_name", { length: 255 }),
    description: text("description"),

    // Raw event data (user-provided JSON)
    eventData: jsonb("event_data").$type<Record<string, unknown>>(),

    // Status: PENDING (oracle flow, not on-chain yet), CONFIRMED (recorded on-chain)
    status: varchar("status", { length: 20 }).default("PENDING").notNull(),

    // Verification tracking (for oracle-verified events)
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedBy: varchar("verified_by", { length: 42 }), // Oracle address
    blockchainEventId: bigint("blockchain_event_id", { mode: "number" }),
    txHash: varchar("tx_hash", { length: 66 }),

    // Tracking
    createdBy: varchar("created_by", { length: 42 }).notNull(), // User wallet address or oracle address
    createdAt: timestamp("created_at").defaultNow().notNull(),
    confirmedAt: timestamp("confirmed_at"),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => [
    index("evidence_asset_id_idx").on(table.assetId),
    index("evidence_data_hash_idx").on(table.dataHash),
    index("evidence_status_idx").on(table.status),
    index("evidence_service_record_id_idx").on(table.serviceRecordId),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.assetId],
      name: "evidence_asset_id_fk",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.serviceRecordId],
      foreignColumns: [serviceRecordsProviderA.id],
      name: "evidence_service_record_id_fk",
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
  (table) => [index("auth_nonces_address_idx").on(table.address)]
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

export type ServiceRecordProviderA = typeof serviceRecordsProviderA.$inferSelect;
export type NewServiceRecordProviderA =
  typeof serviceRecordsProviderA.$inferInsert;

export type ProcessedServiceRecord = typeof processedServiceRecords.$inferSelect;
export type NewProcessedServiceRecord =
  typeof processedServiceRecords.$inferInsert;

export type AuthNonce = typeof authNonces.$inferSelect;
export type NewAuthNonce = typeof authNonces.$inferInsert;
