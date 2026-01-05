import { db } from "./index";
import { serviceProviders, serviceRecordsProviderA } from "./schema";

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

  // Seed example service records with the new schema
  await db.insert(serviceRecordsProviderA).values({
    recordId: "SVC-2024-002",
    assetId: 4,
    providerId: "rolex-service-jakarta",
    eventType: "MAINTENANCE",
    eventName: "Routine Service",
    serviceDate: "2024-12-01",
    technicianName: "Ahmad Rizki",
    technicianNotes: "Watch in excellent condition",
    workPerformed: ["Movement cleaning", "Water resistance test", "Gasket replacement"],
    partsReplaced: [
      { name: "Gasket", partNumber: "GK-001", quantity: 1 }
    ],
    verified: true,
  }).onConflictDoNothing();

  console.log("✅ Database seeded!");
}

seed()
  .catch(console.error)
  .then(() => process.exit(0));
