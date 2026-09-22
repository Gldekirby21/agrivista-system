"use client";

import React from "react";

/**
 * DECOMMISSIONED PER APPROVED FDD
 * Objective 5 (Historical Crop Yield & Purchase Modeling) is strictly VIEW-ONLY.
 * Forecast generation modal is permanently decommissioned.
 */
export const ForecastGeneratorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = () => {
  return null;
};
