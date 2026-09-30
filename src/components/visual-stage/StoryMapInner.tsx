"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { StoryMapProps } from "./StoryMap";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function FitBounds({ locations }: { locations: StoryMapProps["locations"] }) {
  const map = useMap();

  useEffect(() => {
    if (!locations || locations.length === 0) return;

    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13);
      return;
    }

    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, locations]);

  return null;
}

export default function StoryMapInner({
  locations = [],
  className = "",
}: StoryMapProps) {
  if (!locations || locations.length === 0) {
    return (
      <div
        className={`h-64 w-full rounded-2xl bg-aged-paper/40 border border-warm-brown/15 flex items-center justify-center ${className}`}
      >
        <p className="text-sm text-ink/50 font-serif">No locations to display on map yet</p>
      </div>
    );
  }

  const defaultCenter: [number, number] = [locations[0].lat, locations[0].lng];

  return (
    <div
      className={`relative h-64 w-full rounded-2xl overflow-hidden border border-warm-brown/20 shadow-sm bg-aged-paper/30 ${className}`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={locations.length === 1 ? 12 : 4}
        scrollWheelZoom={false}
        className="h-full w-full z-0 [filter:sepia(0.2)_contrast(1.02)_saturate(0.92)]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds locations={locations} />
        {locations.map((loc, idx) => (
          <Marker
            key={`${loc.name}-${loc.lat}-${loc.lng}-${idx}`}
            position={[loc.lat, loc.lng]}
          >
            <Popup>
              <div className="font-sans text-xs">
                <p className="font-bold text-warm-brown text-sm">{loc.name}</p>
                <p className="text-ink/70 text-[11px] mt-0.5">
                  {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
