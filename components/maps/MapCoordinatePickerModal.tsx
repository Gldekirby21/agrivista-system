"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, MapPin, Layers, Check, Search, Globe, Navigation, Compass } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/Button";

export interface MapCoordinatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number | string | null;
  initialLng?: number | string | null;
  initialBarangay?: string;
  onSelectCoordinates: (latitude: string, longitude: string) => void;
  title?: string;
  subtitle?: string;
}

// Polomolok Municipal Center & Barangays Centroids
export const POLOMOLOK_BARANGAYS_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Poblacion: { lat: 6.2189, lng: 125.0645 },
  Bentung: { lat: 6.2310, lng: 125.0350 },
  "Cannery Site": { lat: 6.2425, lng: 125.0831 },
  "Crossing Pangi": { lat: 6.2210, lng: 125.0510 },
  Glamang: { lat: 6.2050, lng: 125.1050 },
  Kinilis: { lat: 6.2750, lng: 125.0420 },
  "Klinan 6": { lat: 6.1850, lng: 125.0750 },
  "Koronadal Proper": { lat: 6.2350, lng: 125.1200 },
  "Lam-caliaf": { lat: 6.2600, lng: 125.0150 },
  Lapu: { lat: 6.2480, lng: 125.0280 },
  Lumakil: { lat: 6.2020, lng: 125.0480 },
  Maligo: { lat: 6.2900, lng: 125.0750 },
  Magsaysay: { lat: 6.2120, lng: 125.0180 },
  Pagalungan: { lat: 6.1750, lng: 125.0450 },
  Polo: { lat: 6.2280, lng: 125.0920 },
  Rubber: { lat: 6.2580, lng: 125.1080 },
  "Silway 7": { lat: 6.1680, lng: 125.0950 },
  "Silway 8": { lat: 6.1550, lng: 125.1120 },
  Sulit: { lat: 6.1950, lng: 125.1350 },
  Sumbakil: { lat: 6.1820, lng: 125.1520 },
  "Upper Klinan": { lat: 6.1920, lng: 125.0600 },
};

export const MapCoordinatePickerModal: React.FC<MapCoordinatePickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialBarangay,
  onSelectCoordinates,
  title = "Interactive Map Pin Drop",
  subtitle = "Click or drag the pin anywhere on the map to set the exact farm centroid coordinates.",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Default coordinate: Polomolok Municipal Hall (6.2189, 125.0645)
  const defaultLat = initialLat && !isNaN(Number(initialLat)) ? Number(initialLat) : 6.2189;
  const defaultLng = initialLng && !isNaN(Number(initialLng)) ? Number(initialLng) : 125.0645;

  const [currentLat, setCurrentLat] = useState<number>(defaultLat);
  const [currentLng, setCurrentLng] = useState<number>(defaultLng);
  const [mapType, setMapType] = useState<"satellite" | "streets">("satellite");
  const [selectedBarangay, setSelectedBarangay] = useState<string>(initialBarangay || "Poblacion");
  const [isMapReady, setIsMapReady] = useState(false);

  // Sync state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = initialLat && !isNaN(Number(initialLat)) ? Number(initialLat) : 6.2189;
      const lng = initialLng && !isNaN(Number(initialLng)) ? Number(initialLng) : 125.0645;
      setCurrentLat(lat);
      setCurrentLng(lng);
      if (initialBarangay && POLOMOLOK_BARANGAYS_COORDINATES[initialBarangay]) {
        setSelectedBarangay(initialBarangay);
      }
    }
  }, [isOpen, initialLat, initialLng, initialBarangay]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isSubscribed = true;

    // Dynamically import Leaflet to prevent SSR window/document issues
    import("leaflet").then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create Custom SVG Marker Icon
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 6px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
              <span>📍 Farm Centroid</span>
            </div>
            <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #047857; margin-top: -2px;"></div>
            <div style="width: 8px; height: 8px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px); margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Add Tile Layer (Esri Satellite by default for agricultural plot visibility)
      const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(mapType === "satellite" ? satelliteUrl : streetsUrl, {
        maxZoom: 19,
        attribution: mapType === "satellite" ? "© Esri World Imagery" : "© OpenStreetMap contributors",
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Add Draggable Marker
      const marker = L.marker([currentLat, currentLng], {
        icon: customIcon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      markerRef.current = marker;

      // Marker drag listener
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setCurrentLat(Number(position.lat.toFixed(6)));
        setCurrentLng(Number(position.lng.toFixed(6)));
      });

      // Map click listener: move pin to clicked spot
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const formattedLat = Number(lat.toFixed(6));
        const formattedLng = Number(lng.toFixed(6));
        marker.setLatLng([formattedLat, formattedLng]);
        setCurrentLat(formattedLat);
        setCurrentLng(formattedLng);
      });

      // Trigger size recalculation after modal transition
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
        setIsMapReady(true);
      }, 250);
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setIsMapReady(false);
    };
  }, [isOpen]);

  // Handle Map Type change (Satellite vs Street)
  const handleToggleMapType = (type: "satellite" | "streets") => {
    setMapType(type);
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }

      const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      const streetsUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const newLayer = L.tileLayer(type === "satellite" ? satelliteUrl : streetsUrl, {
        maxZoom: 19,
        attribution: type === "satellite" ? "© Esri World Imagery" : "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);

      tileLayerRef.current = newLayer;
    });
  };

  // Jump map to selected Barangay Centroid
  const handleBarangayJump = (bName: string) => {
    setSelectedBarangay(bName);
    const coords = POLOMOLOK_BARANGAYS_COORDINATES[bName];
    if (coords && mapInstanceRef.current && markerRef.current) {
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onSelectCoordinates(currentLat.toFixed(6), currentLng.toFixed(6));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size="4xl"
    >
      <div className="space-y-3">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          {/* Barangay Jump Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-emerald-600" />
              Barangay:
            </span>
            <select
              value={selectedBarangay}
              onChange={(e) => handleBarangayJump(e.target.value)}
              className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              {Object.keys(POLOMOLOK_BARANGAYS_COORDINATES).map((b) => (
                <option key={b} value={b}>
                  Brgy. {b}
                </option>
              ))}
            </select>
          </div>

          {/* Map Layer Switcher (Satellite vs Street) */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleToggleMapType("satellite")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                mapType === "satellite"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Satellite</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMapType("streets")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                mapType === "streets"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Street Map</span>
            </button>
          </div>
        </div>

        {/* Interactive Map Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100 h-[380px] sm:h-[450px]">
          <div ref={mapContainerRef} className="h-full w-full z-0" />

          {/* Floating Instructions Pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
            <span className="inline-flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg border border-white/20">
              <span>🖱️ Click anywhere on the map or drag the pin to set the farm centroid</span>
            </span>
          </div>

          {/* Floating Live Coordinates HUD */}
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-2.5 px-3 border border-slate-200/90 shadow-md">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Selected GPS Centroid
              </span>
            </div>
            <div className="font-mono text-xs font-black text-slate-900 mt-0.5">
              {currentLat.toFixed(6)}° N, {currentLng.toFixed(6)}° E
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Latitude: <strong className="font-mono text-slate-800">{currentLat.toFixed(6)}</strong> | Longitude:{" "}
            <strong className="font-mono text-slate-800">{currentLng.toFixed(6)}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Use Selected Coordinates
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
