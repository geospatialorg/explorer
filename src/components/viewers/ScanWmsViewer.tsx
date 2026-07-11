"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  wmsUrl: string;
  layerName: string;
  geoserverUrl?: string;
}

export function ScanWmsViewer({ wmsUrl, layerName, geoserverUrl = "https://services.geo-spatial.org/geoserver" }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let isMounted = true;

    async function initMap() {
      try {
        const { Map, View } = await import("ol");
        const TileLayer = (await import("ol/layer/Tile")).default;
        const TileWMS = (await import("ol/source/TileWMS")).default;
        const Projection = (await import("ol/proj/Projection")).default;
        const { addProjection } = await import("ol/proj");
        const { getTopLeft, getWidth } = await import("ol/extent");
        const WMTSGrid = (await import("ol/tilegrid/WMTS")).default;

        if (!isMounted || !mapRef.current) return;

        const imageProj = new Projection({
          code: "EPSG:404000",
          units: "pixels",
          extent: [0, 0, 100000, 100000],
        });
        addProjection(imageProj);

        const wmsSource = new TileWMS({
          url: `${geoserverUrl}/wms`,
          params: { LAYERS: layerName, FORMAT: "image/png", SRS: "EPSG:404000", TILED: true },
          serverType: "geoserver",
          crossOrigin: "anonymous",
        });

        const wmsLayer = new TileLayer({ source: wmsSource, opacity: opacity / 100 });

        const map = new Map({
          target: mapRef.current!,
          layers: [wmsLayer],
          view: new View({
            projection: imageProj,
            center: [50000, 50000],
            zoom: 2,
            maxZoom: 10,
          }),
        });

        mapInstance.current = map;
        (mapInstance.current as { wmsLayer: unknown }).wmsLayer = wmsLayer;
      } catch (err) {
        if (isMounted) setError("Nu s-a putut încărca vizualizatorul WMS.");
      }
    }

    initMap();
    return () => { isMounted = false; };
  }, [wmsUrl, layerName, geoserverUrl]);

  useEffect(() => {
    const m = mapInstance.current as { wmsLayer?: { setOpacity: (v: number) => void } } | null;
    m?.wmsLayer?.setOpacity(opacity / 100);
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
