"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { Resource } from "@/lib/db/schema";

const GeoViewer = dynamic(
  () => import("./GeoViewer").then((m) => ({ default: m.GeoViewer })),
  { ssr: false, loading: () => <ViewerPlaceholder dark={false} /> }
);
const ScanWmsViewer = dynamic(
  () => import("./ScanWmsViewer").then((m) => ({ default: m.ScanWmsViewer })),
  { ssr: false, loading: () => <ViewerPlaceholder dark={true} /> }
);

function ViewerPlaceholder({ dark }: { dark: boolean }) {
  return (
    <div
      className={`w-full h-full min-h-[400px] animate-pulse ${
        dark ? "bg-[#2B3440]" : "bg-[#EEF1EC]"
      }`}
    />
  );
}

interface Props {
  resources: Resource[];
  georefStatus: string;
  bbox?: [number, number, number, number];
  titilerUrl?: string;
  geoserverUrl?: string;
  imageSizeX?: number | null;
  imageSizeY?: number | null;
}

export function ViewerSwitcher({
  resources,
  georefStatus,
  bbox,
  titilerUrl,
  geoserverUrl,
  imageSizeX,
  imageSizeY,
}: Props) {
  const cogResource = resources.find((r) => r.resourceType === "cog");
  const wmsScanResource = resources.find((r) => r.resourceType === "wms_scan");
  const wmsResource = resources.find((r) => r.resourceType === "wms");
  const activeWms = wmsScanResource ?? wmsResource;
  const isGeoref = georefStatus !== "none";
  const hasGeo = Boolean(isGeoref && cogResource);
  const hasScan = Boolean(activeWms);

  const [mode, setMode] = useState<"geo" | "scan">(hasGeo ? "geo" : "scan");
  const [opacity, setOpacity] = useState(100);

  if (!hasGeo && !hasScan) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[#EEF0F3] text-[#5B6B7A] text-[14px]">
        Nu există resurse vizualizabile pentru această planșă.
      </div>
    );
  }

  const activeMode = mode === "geo" && hasGeo ? "geo" : hasScan ? "scan" : "geo";

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map canvas */}
      <div className="w-full h-full">
        {activeMode === "geo" && cogResource ? (
          <GeoViewer
            cogUrl={cogResource.url}
            bbox={bbox}
            titilerUrl={titilerUrl}
            opacity={opacity}
          />
        ) : activeWms ? (
          <ScanWmsViewer
            wmsUrl={activeWms.url}
            layerName={activeWms.layerName ?? ""}
            geoserverUrl={geoserverUrl}
            imageSizeX={imageSizeX}
            imageSizeY={imageSizeY}
            opacity={opacity}
          />
        ) : null}
      </div>

      {/* Floating top controls */}
      <div className="absolute left-4 top-4 right-4 z-20 flex flex-wrap gap-3 items-start pointer-events-none">
        {hasGeo && hasScan && (
          <div
            role="group"
            aria-label="Mod vizualizare"
            className="flex bg-white rounded-[10px] p-1 shadow-[0_2px_10px_rgba(30,52,72,0.18)] pointer-events-auto"
          >
            <button
              type="button"
              aria-pressed={activeMode === "geo"}
              onClick={() => setMode("geo")}
              className={`text-[14px] px-4 h-[44px] border-0 rounded-[7px] cursor-pointer transition-colors ${
                activeMode === "geo"
                  ? "bg-[#1E3448] text-white font-bold"
                  : "bg-white text-[#1E3448] font-normal hover:bg-[#F3F4F6]"
              }`}
            >
              Georeferențiat
            </button>
            <button
              type="button"
              aria-pressed={activeMode === "scan"}
              onClick={() => setMode("scan")}
              className={`text-[14px] px-4 h-[44px] border-0 rounded-[7px] cursor-pointer transition-colors ${
                activeMode === "scan"
                  ? "bg-[#1E3448] text-white font-bold"
                  : "bg-white text-[#1E3448] font-normal hover:bg-[#F3F4F6]"
              }`}
            >
              Scanare originală
            </button>
          </div>
        )}

        <label className="flex items-center gap-3 bg-white rounded-[10px] px-4 h-[52px] shadow-[0_2px_10px_rgba(30,52,72,0.18)] text-[14px] text-[#1E3448] pointer-events-auto">
          Opacitate
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-[120px] sm:w-[140px] accent-[#C2462E] cursor-pointer"
          />
          <span className="font-mono text-[13px] min-w-[40px] text-right">{opacity}%</span>
        </label>
      </div>
    </div>
  );
}
