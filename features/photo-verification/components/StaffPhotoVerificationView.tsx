"use client";

import React from "react";
import { PhotoVerificationList } from "./PhotoVerificationList";
import { CropLossCaseVerificationListItem } from "../types";

interface StaffPhotoVerificationViewProps {
  initialItems: CropLossCaseVerificationListItem[];
  totalCount: number;
}

export const StaffPhotoVerificationView: React.FC<StaffPhotoVerificationViewProps> = ({
  initialItems,
  totalCount,
}) => {
  return (
    <div className="space-y-6">
      <PhotoVerificationList
        initialItems={initialItems}
        totalCount={totalCount}
        userRole="OMAG_STAFF"
      />
    </div>
  );
};
