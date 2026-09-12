"use client";

import React from "react";
import { Sprout, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { FarmLandholdingDetail, CropRecordDetail } from "../types";
import { formatDate } from "@/lib/utils";

export interface CropListProps {
  farms: FarmLandholdingDetail[];
}

export const CropList: React.FC<CropListProps> = ({ farms }) => {
  // Flatten crops with parcel information
  const allCrops: Array<{
    crop: CropRecordDetail;
    parcelNumber: string;
    farmName: string | null;
    barangay: string;
  }> = [];

  for (const farm of farms) {
    for (const parcel of farm.parcels) {
      for (const crop of parcel.crops) {
        allCrops.push({
          crop,
          parcelNumber: parcel.parcelNumber,
          farmName: farm.farmName,
          barangay: farm.barangay,
        });
      }
    }
  }

  // Sort latest planting date first
  allCrops.sort((a, b) => new Date(b.crop.plantingDate).getTime() - new Date(a.crop.plantingDate).getTime());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Recorded Crop Plantings &amp; Crop Cycles
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Latest Recorded Crop Records (Objective 1)
        </span>
      </div>

      {allCrops.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Crop Commodity</th>
                  <th scope="col" className="px-3 py-2.5">Parcel / Location</th>
                  <th scope="col" className="px-3 py-2.5">Planted Area</th>
                  <th scope="col" className="px-3 py-2.5">Season &amp; Year</th>
                  <th scope="col" className="px-3 py-2.5">Planting Date</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCrops.map(({ crop, parcelNumber, farmName, barangay }) => (
                  <tr key={crop.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      <div>
                        <span className="font-bold text-slate-900">{crop.cropType}</span>
                        {crop.variety && (
                          <p className="text-[11px] text-slate-500 font-normal">
                            Variety: {crop.variety}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <div>
                        <span className="font-mono font-semibold text-slate-800">{parcelNumber}</span>
                        <p className="text-[10px] text-slate-400">
                          {farmName || "Farm Plot"} • Brgy. {barangay}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {crop.plantedAreaHa} ha
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <span>{crop.season} {crop.year}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500 font-mono text-[11px]">
                      {formatDate(crop.plantingDate)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={
                          crop.status === "Standing"
                            ? "success"
                            : crop.status === "Harvested"
                            ? "neutral"
                            : "warning"
                        }
                        size="sm"
                      >
                        {crop.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <Clock className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
          <p className="mt-1.5 text-xs font-semibold text-slate-700">No Crop Records Logged</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Current crop records will appear here as technicians log agricultural cycles on farm parcels.
          </p>
        </div>
      )}
    </div>
  );
};
