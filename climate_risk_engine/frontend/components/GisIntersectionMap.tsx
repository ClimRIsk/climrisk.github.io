'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Rectangle, Popup, Tooltip } from 'react-leaflet';
import { Intersection, MatchedZone } from '@/types/index';

interface GisIntersectionMapProps {
  data: Intersection;
  assetName: string;
}

const ZONE_COLORS: Record<string, string> = {
  coastal_strip: '#38bdf8',
  cyclone_belt: '#f97316',
  permafrost: '#818cf8',
  arid_zone: '#ca8a04',
  river_delta: '#14b8a6',
};

function zoneColor(zone: MatchedZone): string {
  return ZONE_COLORS[zone.type] ?? '#94a3b8';
}

export default function GisIntersectionMap({ data, assetName }: GisIntersectionMapProps) {
  const hasCompoundFlags = data.compound_flags.length > 0;
  const markerColor = hasCompoundFlags ? '#f87171' : data.gis.matched_zones.length > 0 ? '#fbbf24' : '#4ade80';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">GIS × Live Intersection</h2>
          <p className="text-xs text-slate-500 mt-1">{assetName}</p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-slate-700 mb-4" style={{ height: 400 }}>
        <MapContainer
          center={[data.lat, data.lon]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {data.gis.matched_zones.map((zone, i) => (
            <Rectangle
              key={`${zone.type}-${i}`}
              bounds={zone.bounds}
              pathOptions={{ color: zoneColor(zone), weight: 1, fillOpacity: 0.12 }}
            >
              <Tooltip sticky>{zone.label}</Tooltip>
            </Rectangle>
          ))}

          <CircleMarker
            center={[data.lat, data.lon]}
            radius={9}
            pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{assetName}</p>
                <p>
                  {data.lat.toFixed(2)}, {data.lon.toFixed(2)}
                </p>
                <p>Elevation: {data.gis.elevation_m}m · Coast: {data.gis.coastal_km.toFixed(0)}km</p>
                <p>Köppen zone: {data.gis.koppen_zone}</p>
                {data.live && (
                  <p>
                    Now: {data.live.current_temp_c.toFixed(1)}°C
                    {data.live.heat_anomaly_c != null && (
                      <> ({data.live.heat_anomaly_c > 0 ? '+' : ''}{data.live.heat_anomaly_c.toFixed(1)}°C vs norm)</>
                    )}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {data.gis.matched_zones.map((zone, i) => (
          <span
            key={`${zone.type}-${i}`}
            className="text-xs font-medium px-3 py-1 rounded-full border text-slate-200"
            style={{ borderColor: zoneColor(zone), backgroundColor: `${zoneColor(zone)}22` }}
          >
            {zone.label}
          </span>
        ))}
        {data.gis.matched_zones.length === 0 && (
          <span className="text-xs text-slate-500">No mapped static hazard zones at this coordinate.</span>
        )}
      </div>

      {/* Compound risk flags */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Compound Risk Flags (GIS × Live)
        </p>
        {hasCompoundFlags ? (
          <div className="space-y-2">
            {data.compound_flags.map((flag) => (
              <div
                key={flag.id}
                className="text-sm px-3 py-2 rounded-lg border border-red-800 bg-red-950 text-red-200"
              >
                <span className="font-semibold">{flag.label}</span> — {flag.description}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No active intersections right now — no static hazard zone here is currently showing a matching live signal.
          </p>
        )}
      </div>
    </div>
  );
}
