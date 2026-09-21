"""
FastAPI ML Service for OMAG Polomolok Agricultural Analytics
Objective 3: Machine-Learning-Based Crop Yield & Loss Prediction
"""

import sys
import os
import warnings
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# Ensure python/ directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.crop_yield_model import crop_yield_model
from ml.loss_estimator import compute_yield_loss_and_economics
from ml.synthetic_data import generate_synthetic_historical_data
from ml.resource_demand_model import resource_demand_model
from ml.resource_synthetic_data import generate_synthetic_resource_data

app = FastAPI(
    title="OMAG Polomolok ML Prediction Service",
    description="Machine Learning Service for Crop Yield & Loss Estimation (Objective 3) and Resource Demand Modeling (Objective 5)",
    version="1.1.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Pydantic Request & Response Schemas
# ------------------------------------------------------------------------------

class YieldPredictionRequest(BaseModel):
    cropType: str = Field(..., example="Corn")
    barangay: str = Field("Poblacion", example="Poblacion")
    season: str = Field("Wet", example="Wet")
    soilType: str = Field("Volcanic Loam", example="Volcanic Loam")
    plantedAreaHa: float = Field(1.0, gt=0, example=1.5)
    calamityOccurrences: int = Field(0, ge=0, example=0)
    historicalYield: Optional[float] = Field(None, example=4.5)

class LossPredictionRequest(BaseModel):
    cropType: str = Field(..., example="Corn")
    barangay: str = Field("Poblacion", example="Poblacion")
    season: str = Field("Wet", example="Wet")
    soilType: str = Field("Volcanic Loam", example="Volcanic Loam")
    plantedAreaHa: float = Field(1.0, gt=0, example=1.5)
    baselineYieldTonsHa: Optional[float] = Field(None, example=4.5)
    calamityDamagePercent: Optional[float] = Field(None, ge=0, le=100, example=25.0)
    cropUnitPricePhpKg: Optional[float] = Field(None, ge=0, example=18.0)
    calamityOccurrences: int = Field(0, ge=0, example=1)

class TrainModelRequest(BaseModel):
    modelVersion: Optional[str] = Field("v1.0.0", example="v1.0.0")
    customRecords: Optional[List[Dict[str, Any]]] = Field(None)
    useSyntheticFallback: bool = Field(True)

class ResourceDemandPredictionRequest(BaseModel):
    cropType: str = Field(..., example="Corn")
    barangay: str = Field("Poblacion", example="Poblacion")
    season: str = Field("Wet", example="Wet")
    soilType: str = Field("Volcanic Loam", example="Volcanic Loam")
    plantedAreaHa: float = Field(1.0, gt=0, example=2.0)
    calamityOccurrences: int = Field(0, ge=0, example=0)
    averageYieldTonsHa: Optional[float] = Field(None, gt=0, example=4.5)
    projectedFarmers: Optional[int] = Field(None, ge=1, example=3)

class TrainResourceModelRequest(BaseModel):
    modelVersion: Optional[str] = Field("v1.0.0", example="v1.0.0")
    customRecords: Optional[List[Dict[str, Any]]] = Field(None)
    useSyntheticFallback: bool = Field(True)

# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------

@app.get("/")
def root():
    """Root endpoint for Render health and service status."""
    return {
        "status": "online",
        "service": "OMAG Polomolok ML Prediction Service",
        "version": "1.1.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint confirming ML service status and model readiness."""
    return {
        "status": "healthy",
        "service": "OMAG ML Crop Prediction Service",
        "activeModel": crop_yield_model.model_name,
        "modelVersion": crop_yield_model.model_version,
        "algorithm": crop_yield_model.algorithm,
        "isModelLoaded": crop_yield_model.pipeline is not None,
        "objective3Yield": {
            "activeModel": crop_yield_model.model_name,
            "modelVersion": crop_yield_model.model_version,
            "algorithm": crop_yield_model.algorithm,
            "isModelLoaded": crop_yield_model.pipeline is not None,
        },
        "objective5ResourceDemand": {
            "seedModel": resource_demand_model.seed_model_name,
            "fertilizerModel": resource_demand_model.fertilizer_model_name,
            "modelVersion": resource_demand_model.model_version,
            "algorithm": resource_demand_model.algorithm,
            "isModelLoaded": (
                resource_demand_model.seed_pipeline is not None and
                resource_demand_model.fertilizer_pipeline is not None
            ),
        }
    }

@app.get("/models")
def list_models():
    """Returns metadata and metrics of active and registered models (Objective 3)."""
    if crop_yield_model.pipeline is None:
        crop_yield_model._train_baseline_demo_model()

    return {
        "activeModel": crop_yield_model.metrics,
        "classification": "🟡 PROPOSED SYSTEM DESIGN",
        "disclaimer": "Metrics were calculated on a distinct test split. Results from synthetic demonstration data must not be interpreted as official OMAG accuracy."
    }

@app.post("/train/yield")
def train_yield_model(req: TrainModelRequest):
    """
    Triggers model training with scikit-learn RandomForestRegressor.
    Evaluates on test split, computes MAE/RMSE/R², and persists model artifact.
    """
    records = req.customRecords

    if not records or len(records) < 10:
        if req.useSyntheticFallback:
            records = generate_synthetic_historical_data(count=300)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient historical records for model training (Minimum 10 valid records required)."
            )

    try:
        metrics = crop_yield_model.train_and_evaluate(
            records=records,
            version=req.modelVersion or "v1.0.0"
        )
        return {
            "success": True,
            "message": "Model trained and evaluated successfully on distinct test split.",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model training failed: {str(e)}"
        )

@app.post("/predict/yield")
def predict_crop_yield(req: YieldPredictionRequest):
    """
    Predicts crop yield in tons/ha and computes projected total tons based on land area.
    """
    try:
        predicted_yield_tons_ha = crop_yield_model.predict_yield_tons_ha(req.dict())
        projected_total_tons = round(predicted_yield_tons_ha * req.plantedAreaHa, 3)

        return {
            "success": True,
            "cropType": req.cropType,
            "plantedAreaHa": req.plantedAreaHa,
            "predictedYieldTonsHa": predicted_yield_tons_ha,
            "projectedTotalTons": projected_total_tons,
            "modelVersion": crop_yield_model.model_version,
            "algorithm": crop_yield_model.algorithm,
            "classification": "🟡 PROPOSED SYSTEM DESIGN",
            "disclaimer": "Prediction is an analytical estimate based on available historical data and model output. It does not replace official agricultural surveys."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Prediction failed: {str(e)}"
        )

@app.post("/predict/loss")
def predict_crop_loss(req: LossPredictionRequest):
    """
    Predicts normal crop yield and calculates deterministic yield reduction,
    loss percentage, and estimated economic loss (if unit price is available).
    """
    try:
        predicted_yield_tons_ha = crop_yield_model.predict_yield_tons_ha(req.dict())
        
        loss_results = compute_yield_loss_and_economics(
            predicted_yield_tons_ha=predicted_yield_tons_ha,
            baseline_yield_tons_ha=req.baselineYieldTonsHa,
            planted_area_ha=req.plantedAreaHa,
            crop_unit_price_php_per_kg=req.cropUnitPricePhpKg,
            calamity_damage_percent=req.calamityDamagePercent
        )

        return {
            "success": True,
            "cropType": req.cropType,
            "modelVersion": crop_yield_model.model_version,
            "algorithm": crop_yield_model.algorithm,
            **loss_results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loss prediction failed: {str(e)}"
        )

# ------------------------------------------------------------------------------
# Objective 5 Endpoints: Resource Demand Forecasting
# ------------------------------------------------------------------------------

@app.get("/models/resource-demand")
def list_resource_demand_models():
    """
    Returns metadata and metrics of active Seed and Fertilizer regression models.
    """
    if resource_demand_model.seed_pipeline is None or resource_demand_model.fertilizer_pipeline is None:
        resource_demand_model._train_baseline_demo_models()

    return {
        "seedModel": resource_demand_model.seed_metrics,
        "fertilizerModel": resource_demand_model.fertilizer_metrics,
        "modelVersion": resource_demand_model.model_version,
        "algorithm": resource_demand_model.algorithm,
        "classification": "🟡 PROPOSED SYSTEM DESIGN",
        "datasetClassification": "⚫ SYNTHETIC — Demonstration/Testing Data",
        "disclaimer": "These metrics reflect performance on the available demonstration/training dataset and do not establish real-world OMAG forecasting accuracy."
    }

@app.post("/train/resource-demand")
def train_resource_demand_models(req: TrainResourceModelRequest):
    """
    Trains both Seed and Fertilizer regression models on historical agricultural data.
    Uses Time-Aware train/test split when chronological year data exists.
    Evaluates real MAE, RMSE, and R² on test split, and persists model artifacts.
    """
    records = req.customRecords

    if not records or len(records) < 10:
        if req.useSyntheticFallback:
            records = generate_synthetic_resource_data(count=100, seed=42)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient historical records for resource demand model training (Minimum 10 valid records required)."
            )

    try:
        summary = resource_demand_model.train_and_evaluate(
            records=records,
            version=req.modelVersion or "v1.0.0"
        )
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource demand model training failed: {str(e)}"
        )

@app.post("/predict/resource-demand")
def predict_resource_demand(req: ResourceDemandPredictionRequest):
    """
    Runs dual inference for seed and fertilizer demand given agricultural context.
    Separates ML predictions from deterministic per-hectare / per-farmer derived values.
    """
    try:
        results = resource_demand_model.predict_resource_demand(req.dict())
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource demand prediction failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
