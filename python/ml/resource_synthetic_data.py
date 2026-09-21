"""
Synthetic Historical Resource Demand & Agricultural Data Generator (Polomolok, South Cotabato)
Strictly for development, regression testing, and academic capstone demonstration.
Objective 5: Seed and Fertilizer Demand Modeling.
"""

from typing import List, Dict, Any
import numpy as np

POLOMOLOK_BARANGAYS = [
  "Bentung", "Cannery Site", "Crossing Pangi", "Glamang", "Kinilis",
  "Klinan 6", "Koronadal Proper", "Lam-caliaf", "Lapu", "Lumakil",
  "Maligo", "Magsaysay", "Pagalungan", "Poblacion", "Polo",
  "Rubber", "Silway 7", "Silway 8", "Sulit", "Sumbakil", "Upper Klinan"
]

# Agricultural and resource profile baselines per crop type
# Note: Seed rates (kg/ha) and fertilizer rates (bags/ha) represent agronomic demonstration baselines,
# pending official OMAG municipal allocation rule confirmation.
CROP_RESOURCE_PROFILES = {
    "Corn": {
        "baselineYield": 4.5,
        "seedRateKgPerHa": 18.5,
        "fertilizerBagsPerHa": 6.0,
        "variance": 0.8
    },
    "Rice": {
        "baselineYield": 5.2,
        "seedRateKgPerHa": 40.0,
        "fertilizerBagsPerHa": 7.5,
        "variance": 0.9
    },
    "Pineapple": {
        "baselineYield": 22.0,
        "seedRateKgPerHa": 12.0,
        "fertilizerBagsPerHa": 10.0,
        "variance": 3.5
    },
    "Papaya": {
        "baselineYield": 18.0,
        "seedRateKgPerHa": 0.5,
        "fertilizerBagsPerHa": 8.0,
        "variance": 2.8
    },
    "Banana": {
        "baselineYield": 14.0,
        "seedRateKgPerHa": 4.0,
        "fertilizerBagsPerHa": 8.5,
        "variance": 2.2
    },
    "Cassava": {
        "baselineYield": 12.0,
        "seedRateKgPerHa": 8.0,
        "fertilizerBagsPerHa": 5.0,
        "variance": 2.0
    },
    "Coffee": {
        "baselineYield": 1.8,
        "seedRateKgPerHa": 2.5,
        "fertilizerBagsPerHa": 6.5,
        "variance": 0.4
    },
}

SOIL_TYPES = ["Volcanic Loam", "Clay Loam", "Sandy Clay", "Clay"]
SEASONS = ["Wet", "Dry"]

def generate_synthetic_resource_data(count: int = 100, seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generates a deterministic synthetic dataset spanning 2021–2025 with seed and fertilizer usage.
    Clearly labeled as ⚫ SYNTHETIC — Demonstration/Testing Data.
    """
    np.random.seed(seed)
    records: List[Dict[str, Any]] = []
    crops = list(CROP_RESOURCE_PROFILES.keys())

    # Generate across years 2021-2025 to enable authentic time-aware train/test splitting
    years = [2021, 2022, 2023, 2024, 2025]

    for i in range(count):
        crop = crops[i % len(crops)]
        profile = CROP_RESOURCE_PROFILES[crop]
        brgy = POLOMOLOK_BARANGAYS[i % len(POLOMOLOK_BARANGAYS)]
        year = years[i % len(years)]
        season = SEASONS[i % len(SEASONS)]
        soil = SOIL_TYPES[i % len(SOIL_TYPES)]

        # Farm planted area between 0.5 and 3.5 hectares
        area = max(0.2, round(float(np.random.uniform(0.5, 3.5)), 2))
        calamities = int(np.random.choice([0, 0, 0, 1, 2], p=[0.6, 0.2, 0.1, 0.07, 0.03]))

        # Calamity impacts yield slightly
        calamity_penalty = calamities * 0.15
        yield_tons_ha = max(0.5, round(
            profile["baselineYield"] + float(np.random.normal(0, profile["variance"] * 0.25)) - (profile["baselineYield"] * calamity_penalty),
            2
        ))

        production_tons = round(yield_tons_ha * area, 2)
        harvested_area = round(area * (1.0 - (calamities * 0.08)), 2)

        # Seed usage modeled with slight variation per hectare
        seed_usage_kg = max(
            0.5,
            round(area * profile["seedRateKgPerHa"] * float(np.random.uniform(0.92, 1.08)), 2)
        )

        # Fertilizer usage modeled in 50-kg bags with slight variation per hectare
        fertilizer_usage_bags = max(
            1.0,
            round(area * profile["fertilizerBagsPerHa"] * float(np.random.uniform(0.90, 1.10)), 1)
        )

        records.append({
            "id": i + 1,
            "barangay": brgy,
            "year": year,
            "season": season,
            "cropType": crop,
            "plantedAreaHa": area,
            "harvestedAreaHa": max(0.1, harvested_area),
            "productionTons": production_tons,
            "averageYieldTonsHa": yield_tons_ha,
            "seedUsageKg": seed_usage_kg,
            "fertilizerUsageBags": fertilizer_usage_bags,
            "soilType": soil,
            "calamityOccurrences": calamities,
            "status": "ACTIVE",
            "isSynthetic": True,
            "datasetClassification": "⚫ SYNTHETIC — Demonstration/Testing Data",
        })

    # Sort records chronologically to maintain time-series integrity
    records.sort(key=lambda r: (r["year"], r["season"], r["barangay"]))
    return records
