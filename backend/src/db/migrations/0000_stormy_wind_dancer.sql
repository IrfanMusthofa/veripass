CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" bigint NOT NULL,
	"data_hash" varchar(66) NOT NULL,
	"manufacturer" varchar(255) NOT NULL,
	"model" varchar(255) NOT NULL,
	"serial_number" varchar(255) NOT NULL,
	"manufactured_date" varchar(10),
	"description" text,
	"images" jsonb,
	"metadata" jsonb,
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assets_asset_id_unique" UNIQUE("asset_id"),
	CONSTRAINT "assets_data_hash_unique" UNIQUE("data_hash")
);
--> statement-breakpoint
CREATE TABLE "auth_nonces" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(42) NOT NULL,
	"nonce" varchar(66) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_nonces_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" bigint NOT NULL,
	"data_hash" varchar(66) NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"event_date" varchar(10),
	"provider_id" varchar(255),
	"provider_name" varchar(255),
	"description" text,
	"files" jsonb,
	"metadata" jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" varchar(42),
	"blockchain_event_id" bigint,
	"tx_hash" varchar(66),
	"created_by" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	CONSTRAINT "evidence_data_hash_unique" UNIQUE("data_hash")
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"provider_name" varchar(255) NOT NULL,
	"provider_type" varchar(50) NOT NULL,
	"is_trusted" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_providers_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
CREATE TABLE "service_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" varchar(255) NOT NULL,
	"asset_id" bigint NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"service_type" varchar(50) NOT NULL,
	"service_date" varchar(10) NOT NULL,
	"technician" varchar(255),
	"work_performed" jsonb,
	"notes" text,
	"verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_records_record_id_unique" UNIQUE("record_id")
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(50) NOT NULL,
	"asset_id" bigint NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"provider_id" varchar(255),
	"requested_by" varchar(42) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"blockchain_event_id" bigint,
	"tx_hash" varchar(66),
	"data_hash" varchar(66),
	"evidence_id" bigint,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	CONSTRAINT "verification_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "asset_id_idx" ON "assets" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "data_hash_idx" ON "assets" USING btree ("data_hash");--> statement-breakpoint
CREATE INDEX "auth_nonces_address_idx" ON "auth_nonces" USING btree ("address");--> statement-breakpoint
CREATE INDEX "evidence_asset_id_idx" ON "evidence" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "evidence_data_hash_idx" ON "evidence" USING btree ("data_hash");--> statement-breakpoint
CREATE INDEX "service_records_asset_id_idx" ON "service_records" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "verification_requests_status_idx" ON "verification_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_requests_asset_id_idx" ON "verification_requests" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "verification_requests_evidence_id_idx" ON "verification_requests" USING btree ("evidence_id");