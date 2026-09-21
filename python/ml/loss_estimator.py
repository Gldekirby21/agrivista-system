"""
Deterministic Crop Loss & Economic Estimation Module
Distinguishes pure Machine Learning predictions from deterministic loss math.
"""

from typing import Dict, Any, Optional

def compute_yield_loss_and_economics(
    predicted_yield_tons_ha: float,
    baseline_yield_tons_ha: Optional[float] = None,
    planted_area_ha: float = 1.0,
    crop_unit_price_php_per_kg: Optional[float] = None,
    calamity_damage_percent: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes deterministic yield reduction and economic loss.
    
    Rules:
    1. Zero division safety.
    2. Negative values clamped.
    3. Economic loss computed ONLY if a valid unit price (> 0) is supplied.
    4. Explicit disclaimer attached.
    """
    # Defensive inputs
    predicted_yield = max(0.0, float(predicted_yield_tons_ha))
    area = max(0.01, float(planted_area_ha))
    
    # Calculate baseline normal production
    if baseline_yield_tons_ha is not None and baseline_yield_tons_ha > 0:
        baseline_yield = float(baseline_yield_tons_ha)
    else:
        # If no custom baseline provided, use predicted yield as normal baseline
        baseline_yield = max(0.1, predicted_yield)

    projected_normal_total_tons = round(baseline_yield * area, 3)

    # If calamity damage percent is explicitly provided from damage inspection
    if calamity_damage_percent is not None and calamity_damage_percent >= 0:
        damage_pct = min(100.0, max(0.0, float(calamity_damage_percent)))
        predicted_remaining_total_tons = round(max(0.0, projected_normal_total_tons * (1.0 - damage_pct / 100.0)), 3)
        predicted_yield_reduction_percent = damage_pct
        yield_reduction_tons = round(projected_normal_total_tons - predicted_remaining_total_tons, 3)
    else:
        # Compare predicted yield vs baseline
        predicted_total_tons = round(predicted_yield * area, 3)
        if predicted_total_tons < projected_normal_total_tons:
            yield_reduction_tons = round(projected_normal_total_tons - predicted_total_tons, 3)
            predicted_yield_reduction_percent = round((yield_reduction_tons / projected_normal_total_tons) * 100.0, 2)
            predicted_remaining_total_tons = predicted_total_tons
        else:
            yield_reduction_tons = 0.0
            predicted_yield_reduction_percent = 0.0
            predicted_remaining_total_tons = predicted_total_tons

    # Economic Loss Estimation (in Philippine Pesos)
    estimated_economic_loss_php: Optional[float] = None
    economic_loss_status = "UNAVAILABLE"
    
    if crop_unit_price_php_per_kg is not None and crop_unit_price_php_per_kg > 0:
        price_per_kg = float(crop_unit_price_php_per_kg)
        yield_reduction_kg = round(yield_reduction_tons * 1000.0, 2)
        estimated_economic_loss_php = round(yield_reduction_kg * price_per_kg, 2)
        economic_loss_status = "ESTIMATED"
    else:
        economic_loss_status = "PRICE_DATA_UNAVAILABLE"

    return {
        "projectedNormalYieldTonsHa": round(baseline_yield, 3),
        "projectedNormalTotalTons": round(projected_normal_total_tons, 3),
        "predictedRemainingYieldTonsHa": round(predicted_remaining_total_tons / area, 3),
        "predictedRemainingTotalTons": round(predicted_remaining_total_tons, 3),
        "yieldReductionTons": round(yield_reduction_tons, 3),
        "predictedYieldReductionPercent": round(predicted_yield_reduction_percent, 2),
        "estimatedEconomicLossPhp": estimated_economic_loss_php,
        "economicLossStatus": economic_loss_status,
        "unitPricePhpKgUsed": crop_unit_price_php_per_kg if economic_loss_status == "ESTIMATED" else None,
        "plantedAreaHa": area,
        "disclaimer": "Prediction and economic loss are analytical estimates based on model output and available data. They do not constitute official PCIC insurance appraisal or compensation."
    }
