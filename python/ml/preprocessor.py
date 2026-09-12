"""
Data Preprocessing Pipeline for Crop Yield & Loss Prediction
Scikit-Learn ColumnTransformer for structured agricultural features.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

CATEGORICAL_FEATURES = ["cropType", "barangay", "season", "soilType"]
NUMERICAL_FEATURES = ["plantedAreaHa", "calamityOccurrences", "historicalYield"]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

def create_preprocessing_pipeline() -> ColumnTransformer:
    """
    Constructs a reproducible scikit-learn ColumnTransformer
    handling missing values, one-hot categorical encoding, and numeric scaling.
    """
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    numerical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
            ("num", numerical_transformer, NUMERICAL_FEATURES)
        ],
        remainder="drop"
    )

    return preprocessor

def validate_and_format_training_data(records: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Validates raw training records from database and returns (X, y) DataFrames.
    Requires minimum 10 records.
    """
    if not records or len(records) < 10:
        raise ValueError(f"Insufficient historical records for model training (Received {len(records) if records else 0}, minimum required: 10).")

    df = pd.DataFrame(records)

    # Validate target column
    if "averageYieldTonsHa" not in df.columns and "productionTons" not in df.columns:
        raise ValueError("Missing required target variable ('averageYieldTonsHa' or 'productionTons').")

    # Compute average yield if missing
    if "averageYieldTonsHa" not in df.columns or df["averageYieldTonsHa"].isnull().all():
        if "productionTons" in df.columns and "harvestedAreaHa" in df.columns:
            df["averageYieldTonsHa"] = df["productionTons"] / df["harvestedAreaHa"].replace(0, np.nan)
        else:
            raise ValueError("Cannot derive target yield from dataset.")

    # Fill defaults for missing feature columns safely
    if "soilType" not in df.columns:
        df["soilType"] = "Volcanic Loam"
    if "calamityOccurrences" not in df.columns:
        df["calamityOccurrences"] = 0
    if "historicalYield" not in df.columns:
        df["historicalYield"] = df["averageYieldTonsHa"]

    # Filter invalid target values (<= 0 or NaN)
    df = df.dropna(subset=["averageYieldTonsHa"])
    df = df[df["averageYieldTonsHa"] > 0]

    if len(df) < 10:
        raise ValueError(f"Insufficient valid historical records after filtering (Valid records: {len(df)}, minimum required: 10).")

    for col in CATEGORICAL_FEATURES:
        if col not in df.columns:
            df[col] = "Unknown"
        else:
            df[col] = df[col].fillna("Unknown").astype(str)

    for col in NUMERICAL_FEATURES:
        if col not in df.columns:
            df[col] = 1.0
        else:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(1.0)
            df[col] = df[col].apply(lambda v: max(0.01, float(v)) if "Area" in col else max(0.0, float(v)))

    X = df[ALL_FEATURES]
    y = df["averageYieldTonsHa"].astype(float)

    return X, y
