import React from "react";
import { PhotoVerificationList } from "./PhotoVerificationList";
import { PhotoVerificationListItem } from "../types";

interface StaffPhotoVerificationViewProps {
  initialItems: PhotoVerificationListItem[];
  totalCount: number;
}

export const StaffPhotoVerificationView: React.FC<StaffPhotoVerificationViewProps> = ({
  initialItems,
  totalCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Photo & GPS Metadata Verification Desk
        </h1>
        <p className="text-xs text-slate-400">
          Deterministic geospatial verification and AI advisory interpretation for farm and damage photographs.
        </p>
      </div>

      <PhotoVerificationList
        initialItems={initialItems}
        totalCount={totalCount}
        userRole="OMAG_STAFF"
      />
    </div>
  );
};
