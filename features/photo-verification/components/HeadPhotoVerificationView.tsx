import React from "react";
import { PhotoVerificationList } from "./PhotoVerificationList";
import { PhotoVerificationListItem } from "../types";

interface HeadPhotoVerificationViewProps {
  initialItems: PhotoVerificationListItem[];
  totalCount: number;
}

export const HeadPhotoVerificationView: React.FC<HeadPhotoVerificationViewProps> = ({
  initialItems,
  totalCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Photo Verification & Metadata Oversight
        </h1>
        <p className="text-xs text-slate-400">
          Executive audit of camera EXIF locations, mathematical distance matching, and advisory AI assessments.
        </p>
      </div>

      <PhotoVerificationList
        initialItems={initialItems}
        totalCount={totalCount}
        userRole="OMAG_HEAD"
      />
    </div>
  );
};
