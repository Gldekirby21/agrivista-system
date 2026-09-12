"use client";

import React from "react";
import { MapPin, Plus, Layers, Sprout } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/Button";
import { FarmLandholdingDetail } from "../types";

export interface FarmParcelListProps {
  farms: FarmLandholdingDetail[];
  isStaff?: boolean;
  onAddParcel?: () => void;
  onRecordCrop?: (parcelId: number, parcelNumber: string, defaultAreaHa: number) => void;
}

export const FarmParcelList: React.FC<FarmParcelListProps> = ({
  farms,
  isStaff = false,
  onAddParcel,
  onRecordCrop,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Registered Farm Landholdings &amp; Georeferenced Parcels
          </h3>
        </div>
        {isStaff && onAddParcel && (
          <Button variant="outline" size="sm" onClick={onAddParcel}>
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add Farm / Parcel
          </Button>
        )}
      </div>

      {farms.length > 0 ? (
        <div className="space-y-3">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
            >
              {/* Farm Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {farm.farmName || `Farm #${farm.id}`}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                      Brgy. {farm.barangay}, Polomolok
                    </span>
                    <span>•</span>
                    <span>Tenure: <strong className="text-slate-700">{farm.tenureType}</strong></span>
                    <span>•</span>
                    <span>Total Area: <strong className="text-slate-700">{farm.totalAreaHa} ha</strong></span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  {farm.parcels.length} Georeferenced Plot{farm.parcels.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Parcels List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-100">
                    <tr>
                      <th scope="col" className="px-3 py-2">Lot / Parcel ID</th>
                      <th scope="col" className="px-3 py-2">Area</th>
                      <th scope="col" className="px-3 py-2">Centroid Geolocation</th>
                      <th scope="col" className="px-3 py-2">Current Standing Crop</th>
                      <th scope="col" className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {farm.parcels.map((parcel) => {
                      const latestCrop = parcel.crops && parcel.crops.length > 0 ? parcel.crops[0] : null;
                      return (
                        <tr key={parcel.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                            {parcel.parcelNumber}
                          </td>
                          <td className="px-3 py-2.5 text-slate-800 font-semibold">
                            {parcel.areaHa} ha
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                            {parcel.latitude && parcel.longitude ? (
                              <span>{parcel.latitude.toFixed(4)}°N, {parcel.longitude.toFixed(4)}°E</span>
                            ) : (
                              <span className="text-slate-400 italic">No GPS coordinates</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {latestCrop ? (
                              <div className="flex items-center gap-1.5">
                                <Badge variant={latestCrop.status === "Standing" ? "success" : "neutral"} size="sm">
                                  {latestCrop.cropType} ({latestCrop.plantedAreaHa} ha)
                                </Badge>
                                <span className="text-[10px] text-slate-400">
                                  {latestCrop.variety || ""}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No active crop</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {isStaff && onRecordCrop && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onRecordCrop(parcel.id, parcel.parcelNumber, parcel.areaHa)}
                                className="h-6 text-[10px] px-2"
                              >
                                <Sprout className="h-3 w-3 mr-1 text-emerald-600" aria-hidden="true" />
                                Record Crop
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
          <MapPin className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
          <p className="mt-1.5 text-xs font-semibold text-slate-700">No Farm Landholdings Registered</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            This farmer profile currently has no registered farm tracts or parcel plots.
          </p>
          {isStaff && onAddParcel && (
            <Button variant="outline" size="sm" onClick={onAddParcel} className="mt-3">
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              Register First Farm Parcel
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
