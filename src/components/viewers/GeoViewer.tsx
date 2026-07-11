"use client";
import { useEffect, useRef, useState } from "react";
import { Layers2Icon, MaximizeIcon, RefreshCwIcon } from "lucide-react";

interface Props {
  cogUrl: string;
  bbox?: [number, number, number, number];
  titilerUrl?: string;
}

export function GeoViewer({ cogUrl, bbox, titilerUrl = "http://localhost:8000" }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [opacity, setOpacity] = useState(100);
  const [error, setError] = useState<string | null>(null);

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
        const tileUrl = `${titilerUrl}/cog/tiles/{z}/{x}/{y}.png?url=${encodedPath}`;

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
      } catch (err) {
        if (isMounted) setError("Nu s-a putut încărca harta. Verificați că TiTiler rulează.");
      }
    }

    initMap();
    return () => { isMounted = false; };
  }, [cogUrl, bbox, titilerUrl]);

  useEffect(() => {
    const m = mapInstance.current as { cogLayer?: { setOpacity: (v: number) => void } } | null;
    m?.cogLayer?.setOpacity(opacity / 100);
  }, [opacity]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {error ? (
        <div className="flex-1 flex items-center justify-center bg-muted rounded-lg p-6 text-center text-sm text-muted-foreground">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div ref={mapRef} className="flex-1 rounded-lg overflow-hidden min-h-[400px]" />
          <div className="absolute bottom-4 left-4 bg-white/90 rounded-md shadow px-3 py-2 flex items-center gap-3 text-sm">
            <Layers2Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Opacitate:</span>
            <input
              type="range" min={0} max={100} value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-20 h-1 accent-primary"
            />
            <span className="text-xs w-8 text-right">{opacity}%</span>
          </div>
        </>
      )}
    </div>
  );
}
