"""
Synthetic Historical Agricultural Data Generator (Polomolok, South Cotabato)
Strictly for development, regression testing, and academic capstone demonstration.
"""

from typing import List, Dict, Any
import numpy as np

POLOMOLOK_BARANGAYS = [
  "Bentung", "Cannery Site", "Crossing Pangi", "Glamang", "Kinilis",
  "Klinan 6", "Koronadal Proper", "Lam-caliaf", "Lapu", "Lumakil",
  "Maligo", "Magsaysay", "Pagalungan", "Poblacion", "Polo",
  "Rubber", "Silway 7", "Silway 8", "Sulit", "Sumbakil", "Upper Klinan"
]

CROP_PROFILES = {
    "Corn": {"baselineYield": 4.5, "variance": 0.8, "typicalArea": 1.5, "pricePhpKg": 18.0},
    "Rice": {"baselineYield": 5.2, "variance": 0.9, "typicalArea": 1.2, "pricePhpKg": 22.0},
    "Pineapple": {"baselineYield": 22.0, "variance": 3.5, "typicalArea": 2.0, "pricePhpKg": 28.0},
    "Papaya": {"baselineYield": 18.0, "variance": 2.8, "typicalArea": 0.8, "pricePhpKg": 25.0},
    "Banana": {"baselineYield": 14.0, "variance": 2.2, "typicalArea": 1.0, "pricePhpKg": 30.0},
    "Cassava": {"baselineYield": 12.0, "variance": 2.0, "typicalArea": 1.0, "pricePhpKg": 12.0},
    "Coffee": {"baselineYield": 1.8, "variance": 0.4, "typicalArea": 1.0, "pricePhpKg": 150.0},
}

SOIL_TYPES = ["Volcanic Loam", "Clay Loam", "Sandy Clay", "Clay"]
SEASONS = ["Wet", "Dry"]

def generate_synthetic_historical_data(count: int = 60, seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generates a deterministic synthetic dataset spanning 2021–2025.
    Clearly labeled as ⚫ SYNTHETIC — Demonstration/Testing Data.
    """
    np.random.seed(seed)
    records: List[Dict[str, Any]] = []

    crops = list(CROP_PROFILES.keys())

    for i in range(count):
        crop = crops[i % len(crops)]
        profile = CROP_PROFILES[crop]
        brgy = POLOMOLOK_BARANGAYS[i % len(POLOMOLOK_BARANGAYS)]
        year = 2021 + (i % 5)
        season = SEASONS[i % len(SEASONS)]
        soil = SOIL_TYPES[i % len(SOIL_TYPES)]
        
        area = max(0.2, round(profile["typicalArea"] + np.random.uniform(-0.4, 0.6), 2))
        calamities = np.random.choice([0, 0, 0, 1, 2], p=[0.6, 0.2, 0.1, 0.07, 0.03])
        
        # Calamity effect on yield
        calamity_penalty = calamities * 0.15
        yield_tons_ha = max(0.5, round(
            profile["baselineYield"] + np.random.normal(0, profile["variance"] * 0.3) - (profile["baselineYield"] * calamity_penalty),
            2
        ))
        
        production_tons = round(yield_tons_ha * area, 2)
        harvested_area = round(area * (1.0 - (calamities * 0.08)), 2)

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
            "soilType": soil,
            "calamityOccurrences": int(calamities),
            "isSynthetic": True,
            "datasetClassification": "⚫ SYNTHETIC — Demonstration/Testing Data",
        })

    return records
