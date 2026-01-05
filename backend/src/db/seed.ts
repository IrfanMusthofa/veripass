import { db } from "./index";
import { assets, serviceProviders, serviceRecords } from "./schema";
import { calculateHash } from "../lib/hash";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed service providers
  await db.insert(serviceProviders).values([
    {
      providerId: "rolex-service-jakarta",
      providerName: "Rolex Official Service Center Jakarta",
      providerType: "service_center",
      isTrusted: true,
    },
    {
      providerId: "authorized-inspector",
      providerName: "PT Inspeksi Indonesia",
      providerType: "inspector",
      isTrusted: true,
    },
  ]).onConflictDoNothing();

  // Seed example service record
  await db.insert(serviceRecords).values({
    recordId: "SVC-2024-001",
    assetId: 3,
    providerId: "rolex-service-jakarta",
    serviceType: "ROUTINE_MAINTENANCE",
    serviceDate: "2024-12-01",
    technician: "Ahmad Rizki",
    workPerformed: ["Movement cleaning", "Water resistance test", "Gasket replacement"],
    notes: "Watch in excellent condition",
    verified: true,
  }).onConflictDoNothing();

  console.log("✅ Database seeded!");
}

seed()
  .catch(console.error)
  .then(() => process.exit(0));
