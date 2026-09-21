/**
 * Multi-Year Historical Agricultural Data Seeder (2021–2025)
 * OMAG Polomolok Agricultural Resource Distribution and Production Analytics System
 * Supplies 3–5 years of historical agricultural records for authentic time-aware ML training.
 */

import { prisma } from "../lib/database/prisma";

const CROP_PROFILES: Record<string, { baselineYield: number; seedKgPerHa: number; fertBagsPerHa: number; soil: string }> = {
  Corn: { baselineYield: 4.5, seedKgPerHa: 18.5, fertBagsPerHa: 6.0, soil: "Volcanic Loam" },
  Rice: { baselineYield: 5.2, seedKgPerHa: 40.0, fertBagsPerHa: 7.5, soil: "Clay Loam" },
  Pineapple: { baselineYield: 22.0, seedKgPerHa: 12.0, fertBagsPerHa: 10.0, soil: "Volcanic Loam" },
  Banana: { baselineYield: 14.0, seedKgPerHa: 4.0, fertBagsPerHa: 8.5, soil: "Clay Loam" },
  Cassava: { baselineYield: 12.0, seedKgPerHa: 8.0, fertBagsPerHa: 5.0, soil: "Sandy Clay" },
};

const BARANGAYS = [
  "Poblacion", "Cannery Site", "Silway 8", "Magsaysay", "Bentung",
  "Koronadal Proper", "Glamang", "Lumakil", "Maligo", "Rubber"
];

const YEARS = [2021, 2022, 2023, 2024]; // 2025 already has records

async function seedMultiYearHistorical() {
  console.log("Seeding multi-year historical agricultural records (2021–2024)...");

  let createdCount = 0;
  for (const year of YEARS) {
    for (const [crop, profile] of Object.entries(CROP_PROFILES)) {
      for (const brgy of BARANGAYS.slice(0, 5)) {
        // Deterministic variation based on year & barangay
        const area = Number((2.0 + ((brgy.length * 7 + year * 3) % 40) / 10).toFixed(2));
        const yieldVal = Number((profile.baselineYield + (((year % 3) - 1) * 0.3)).toFixed(2));
        const prod = Number((yieldVal * area).toFixed(2));
        const seedUsage = Number((area * profile.seedKgPerHa).toFixed(2));
        const fertUsage = Number((area * profile.fertBagsPerHa).toFixed(1));
        const calamity = (year === 2022 && brgy === "Bentung") ? 1 : 0;

        await prisma.historicalAgriculturalData.create({
          data: {
            barangay: brgy,
            year,
            season: year % 2 === 0 ? "Wet" : "Dry",
            cropType: crop,
            plantedAreaHa: area,
            harvestedAreaHa: Number((area * 0.95).toFixed(2)),
            productionTons: prod,
            averageYieldTonsHa: yieldVal,
            seedUsageKg: seedUsage,
            fertilizerUsageBags: fertUsage,
            soilType: profile.soil,
            calamityOccurrences: calamity,
            status: "ACTIVE",
          },
        });
        createdCount++;
      }
    }
  }

  const totalNow = await prisma.historicalAgriculturalData.count();
  console.log(`✅ Successfully seeded ${createdCount} multi-year historical records. Total in database: ${totalNow}`);
}

seedMultiYearHistorical()
  .catch((e) => {
    console.error("Error seeding multi-year data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
