"use client";

import React, { useState, useEffect } from "react";
import { PredictionList } from "./PredictionList";
import { PredictionForm } from "./PredictionForm";
import { ModelTrainingModal } from "./ModelTrainingModal";
import { PredictionRecordDTO, ModelMetricsDTO } from "../types";

export const HeadYieldLossView: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/predictions");
      const data = await res.json();
      if (res.ok && data.success) {
        setPredictions(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  return (
    <div className="space-y-6">
      <PredictionList
        predictions={predictions}
        userRole="OMAG_HEAD"
        loading={loading}
        onOpenNewPrediction={() => setIsPredictionModalOpen(true)}
        onOpenModelTraining={() => setIsTrainingModalOpen(true)}
      />

      {/* New Prediction Modal */}
      <PredictionForm
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        onSuccess={() => {
          setIsPredictionModalOpen(false);
          fetchPredictions();
        }}
      />

      {/* Model Training Modal */}
      <ModelTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        onTrainingComplete={() => {
          fetchPredictions();
        }}
      />
    </div>
  );
};
