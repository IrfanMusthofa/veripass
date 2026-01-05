ALTER TABLE "assets" ADD COLUMN "mint_status" varchar(20) DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "tx_hash" varchar(66);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "minted_at" timestamp;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "event_data" jsonb;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "status" varchar(20) DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
CREATE INDEX "mint_status_idx" ON "assets" USING btree ("mint_status");--> statement-breakpoint
CREATE INDEX "evidence_status_idx" ON "evidence" USING btree ("status");--> statement-breakpoint
ALTER TABLE "evidence" DROP COLUMN "provider_id";--> statement-breakpoint
ALTER TABLE "evidence" DROP COLUMN "files";--> statement-breakpoint
ALTER TABLE "evidence" DROP COLUMN "metadata";