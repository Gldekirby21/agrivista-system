"use client";

import React from "react";
import { PhotoVerificationList } from "./PhotoVerificationList";
import { CropLossCaseVerificationListItem } from "../types";

interface HeadPhotoVerificationViewProps {
  initialItems: CropLossCaseVerificationListItem[];
  totalCount: number;
}

export const HeadPhotoVerificationView: React.FC<HeadPhotoVerificationViewProps> = ({
  initialItems,
  totalCount,
}) => {
  return (
    <div className="space-y-6">
      <PhotoVerificationList
        initialItems={initialItems}
        totalCount={totalCount}
        userRole="OMAG_HEAD"
      />
    </div>
  );
};
