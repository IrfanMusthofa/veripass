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

  // Create a sample asset (required for service records FK)
  const assetData = {
    manufacturer: "Rolex",
    model: "Submariner Date 126610LN",
    serialNumber: "M123456789",
    manufacturedDate: "2023-06-15",
    description: "Black dial and bezel, Oystersteel case",
  };

  const dataHash = calculateHash(assetData);

  await db.insert(assets).values({
    assetId: 1,
    dataHash,
    manufacturer: assetData.manufacturer,
    model: assetData.model,
    serialNumber: assetData.serialNumber,
    manufacturedDate: assetData.manufacturedDate,
    description: assetData.description,
    images: [],
    metadata: null,
    createdBy: "0x0000000000000000000000000000000000000000", // System/seed address
  }).onConflictDoNothing();

  // Seed example service record
  await db.insert(serviceRecords).values({
    recordId: "SVC-2024-001",
    assetId: 1,
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
