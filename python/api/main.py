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

app = FastAPI(
    title="OMAG Polomolok ML Prediction Service",
    description="Machine Learning Service for Crop Yield & Loss Estimation (Objective 3)",
    version="1.0.0"
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

# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------

@app.get("/")
def root():
    """Root endpoint for Render health and service status."""
    return {
        "status": "online",
        "service": "OMAG Polomolok ML Prediction Service",
        "version": "1.0.0",
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
    }

@app.get("/models")
def list_models():
    """Returns metadata and metrics of active and registered models."""
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
