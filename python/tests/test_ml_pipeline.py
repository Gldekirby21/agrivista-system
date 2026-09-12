"""
Python Unit Test Suite for Objective 3 ML Service
Tests preprocessing, training, evaluation metrics, prediction, and edge cases.
"""

import unittest
import sys
import os

# Ensure python/ is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.preprocessor import validate_and_format_training_data, create_preprocessing_pipeline
from ml.crop_yield_model import CropYieldModelManager
from ml.loss_estimator import compute_yield_loss_and_economics
from ml.synthetic_data import generate_synthetic_historical_data

class TestMlPipeline(unittest.TestCase):

    def setUp(self):
        self.model_manager = CropYieldModelManager(model_version="test-v1.0.0")
        self.sample_data = generate_synthetic_historical_data(count=30, seed=42)

    def test_synthetic_data_generation(self):
        self.assertEqual(len(self.sample_data), 30)
        self.assertTrue(all(r["isSynthetic"] for r in self.sample_data))
        self.assertIn("averageYieldTonsHa", self.sample_data[0])

    def test_preprocessing_validation_success(self):
        X, y = validate_and_format_training_data(self.sample_data)
        self.assertEqual(len(X), len(y))
        self.assertGreaterEqual(len(X), 10)
        self.assertIn("cropType", X.columns)
        self.assertIn("plantedAreaHa", X.columns)

    def test_preprocessing_insufficient_records_rejection(self):
        with self.assertRaises(ValueError):
            validate_and_format_training_data(self.sample_data[:5])

    def test_model_training_and_metrics_calculation(self):
        metrics = self.model_manager.train_and_evaluate(self.sample_data, version="test-v1.0.1")
        self.assertIn("mae", metrics)
        self.assertIn("rmse", metrics)
        self.assertIn("r2Score", metrics)
        self.assertGreaterEqual(metrics["mae"], 0.0)
        self.assertGreaterEqual(metrics["rmse"], 0.0)
        self.assertIsInstance(metrics["r2Score"], float)
        self.assertEqual(metrics["algorithm"], "RandomForestRegressor")

    def test_yield_prediction_inference(self):
        self.model_manager.train_and_evaluate(self.sample_data, version="test-v1.0.2")
        feature_input = {
            "cropType": "Corn",
            "barangay": "Poblacion",
            "season": "Wet",
            "soilType": "Volcanic Loam",
            "plantedAreaHa": 2.0,
            "calamityOccurrences": 0,
            "historicalYield": 4.5
        }
        pred_yield = self.model_manager.predict_yield_tons_ha(feature_input)
        self.assertIsInstance(pred_yield, float)
        self.assertGreater(pred_yield, 0.0)
        self.assertLess(pred_yield, 50.0)

    def test_loss_estimation_with_price(self):
        res = compute_yield_loss_and_economics(
            predicted_yield_tons_ha=3.0,
            baseline_yield_tons_ha=5.0,
            planted_area_ha=2.0,
            crop_unit_price_php_per_kg=20.0
        )
        self.assertEqual(res["economicLossStatus"], "ESTIMATED")
        self.assertIsNotNone(res["estimatedEconomicLossPhp"])
        # Expected: normal total = 10 tons, remaining = 6 tons, reduction = 4 tons = 4,000 kg * 20 = 80,000 PHP
        self.assertEqual(res["estimatedEconomicLossPhp"], 80000.0)
        self.assertEqual(res["predictedYieldReductionPercent"], 40.0)

    def test_loss_estimation_without_price(self):
        res = compute_yield_loss_and_economics(
            predicted_yield_tons_ha=3.0,
            baseline_yield_tons_ha=5.0,
            planted_area_ha=1.0,
            crop_unit_price_php_per_kg=None
        )
        self.assertEqual(res["economicLossStatus"], "PRICE_DATA_UNAVAILABLE")
        self.assertIsNone(res["estimatedEconomicLossPhp"])
        self.assertEqual(res["predictedYieldReductionPercent"], 40.0)

    def test_loss_estimation_zero_and_negative_safety(self):
        res = compute_yield_loss_and_economics(
            predicted_yield_tons_ha=6.0,
            baseline_yield_tons_ha=5.0, # Prediction higher than baseline -> 0 loss
            planted_area_ha=1.0
        )
        self.assertEqual(res["yieldReductionTons"], 0.0)
        self.assertEqual(res["predictedYieldReductionPercent"], 0.0)

if __name__ == "__main__":
    unittest.main()
