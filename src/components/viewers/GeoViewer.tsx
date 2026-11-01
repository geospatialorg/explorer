"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

interface Props {
  cogUrl: string;
  bbox?: [number, number, number, number];
  titilerUrl?: string;
  opacity?: number;
}

export function GeoViewer({
  cogUrl,
  bbox,
  titilerUrl = "http://localhost:8000",
  opacity = 100,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let isMounted = true;

    async function initMap() {
      try {
        const ol = await import("ol");
        const { Map, View } = ol;
        const TileLayer = (await import("ol/layer/Tile")).default;
        const XYZ = (await import("ol/source/XYZ")).default;
        const OSM = (await import("ol/source/OSM")).default;
        const { fromLonLat, transformExtent } = await import("ol/proj");
        const ScaleLine = (await import("ol/control/ScaleLine")).default;
        const { defaults: defaultControls } = await import("ol/control");

        if (!isMounted || !mapRef.current) return;

        const encodedPath = encodeURIComponent(cogUrl);
        const tileUrl = `${titilerUrl}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${encodedPath}`;

        const basemap = new TileLayer({ source: new OSM(), opacity: 1 });
        const cogLayer = new TileLayer({
          source: new XYZ({ url: tileUrl, crossOrigin: "anonymous" }),
          opacity: opacity / 100,
        });

        let center = fromLonLat([25.0, 45.9]);
        let zoom = 7;

        if (bbox) {
          const extent = transformExtent(bbox, "EPSG:4326", "EPSG:3857");
          center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        }

        const map = new Map({
          target: mapRef.current!,
          layers: [basemap, cogLayer],
          view: new View({ center, zoom }),
          controls: defaultControls({ attribution: false }).extend([new ScaleLine()]),
        });

        if (bbox) {
          const extent = transformExtent(bbox, "EPSG:4326", "EPSG:3857");
          map.getView().fit(extent, { padding: [20, 20, 20, 20] });
        }

        mapInstance.current = map;
        (mapInstance.current as { cogLayer: unknown }).cogLayer = cogLayer;

        const cogSource = cogLayer.getSource();
        if (cogSource) {
          cogSource.on("tileloadend", () => {
            if (isMounted) setLoading(false);
          });
          cogSource.on("tileloaderror", () => {
            if (isMounted) setLoading(false);
          });
        }
      } catch {
        if (isMounted) {
          setError("Nu s-a putut încărca harta. Verificați că TiTiler rulează.");
          setLoading(false);
        }
      }
    }

    initMap();
    return () => {
      isMounted = false;
    };
  }, [cogUrl, bbox, titilerUrl]);

  useEffect(() => {
    const m = mapInstance.current as { cogLayer?: { setOpacity: (v: number) => void } } | null;
    m?.cogLayer?.setOpacity(opacity / 100);
  }, [opacity]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#EEF1EC]">
      {error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-[14px] text-[#5B6B7A]">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#EEF1EC]/60 z-10">
              <LoaderCircleIcon className="h-8 w-8 animate-spin text-[#1E3448]" />
            </div>
          )}
          <div ref={mapRef} className="flex-1 w-full h-full min-h-[400px]" />
          <span className="absolute right-3 bottom-2.5 text-[12px] text-[#3D4F60] bg-white/95 px-2 py-1 rounded-[4px] pointer-events-none z-10">
            © OpenStreetMap contributors
          </span>
        </>
      )}
    </div>
  );
}
