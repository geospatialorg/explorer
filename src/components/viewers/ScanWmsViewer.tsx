"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

interface Props {
  wmsUrl: string;
  layerName: string;
  geoserverUrl?: string;
  imageSizeX?: number | null;
  imageSizeY?: number | null;
  opacity?: number;
}

async function probeWms(
  endpoint: string,
  layerName: string,
  sizeX = 100000,
  sizeY = 100000
): Promise<{ ok: true; extent: [number, number, number, number] } | { ok: false; reason: string }> {
  try {
    const p = new URLSearchParams({
      SERVICE: "WMS",
      VERSION: "1.1.1",
      REQUEST: "GetMap",
      LAYERS: layerName,
      SRS: "EPSG:404000",
      BBOX: `0,0,${sizeX},${sizeY}`,
      WIDTH: "256",
      HEIGHT: "256",
      FORMAT: "image/png",
      TRANSPARENT: "TRUE",
    });
    const resp = await fetch(`${endpoint}?${p}`);
    const ct = resp.headers.get("Content-Type") ?? "";
    if (ct.includes("image")) {
      return { ok: true, extent: [0, 0, sizeX, sizeY] };
    }
    const body = await resp.text();
    const msg =
      body.match(/<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/i)?.[1]?.trim() ??
      body.slice(0, 300);
    return { ok: false, reason: msg };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

export function ScanWmsViewer({
  wmsUrl,
  layerName,
  geoserverUrl = "https://services.geo-spatial.org/geoserver",
  imageSizeX,
  imageSizeY,
  opacity = 100,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const endpoint = wmsUrl || `${geoserverUrl}/wms`;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let isMounted = true;

    async function initMap() {
      try {
        const sizeX = imageSizeX && imageSizeX > 0 ? imageSizeX : 10000;
        const sizeY = imageSizeY && imageSizeY > 0 ? imageSizeY : 10000;
        const probe = await probeWms(endpoint, layerName, sizeX, sizeY);
        if (!probe.ok) {
          if (isMounted) {
            setError(`WMS error: ${probe.reason}`);
            setLoading(false);
          }
          return;
        }

        const extent = probe.extent;

        const { Map, View } = await import("ol");
        const ImageLayer = (await import("ol/layer/Image")).default;
        const ImageWMS = (await import("ol/source/ImageWMS")).default;
        const Projection = (await import("ol/proj/Projection")).default;
        const { addProjection } = await import("ol/proj");

        if (!isMounted || !mapRef.current) return;

        const imageProj = new Projection({
          code: "EPSG:404000",
          units: "pixels",
          extent,
        });
        addProjection(imageProj);

        const wmsSource = new ImageWMS({
          url: endpoint,
          params: {
            LAYERS: layerName,
            FORMAT: "image/png",
            VERSION: "1.1.1",
            SRS: "EPSG:404000",
            TRANSPARENT: "TRUE",
          },
          serverType: "geoserver",
        });

        const wmsLayer = new ImageLayer({ source: wmsSource, opacity: opacity / 100 });

        const view = new View({
          projection: imageProj,
          showFullExtent: true,
        });

        const map = new Map({
          target: mapRef.current!,
          layers: [wmsLayer],
          view,
        });

        const containerW = mapRef.current?.offsetWidth || 800;
        const containerH = mapRef.current?.offsetHeight || 500;
        view.fit(extent, { size: [containerW, containerH], padding: [24, 24, 24, 24] });

        mapInstance.current = map;
        (mapInstance.current as { wmsLayer: unknown }).wmsLayer = wmsLayer;

        map.once("rendercomplete", () => {
          if (isMounted) setLoading(false);
        });
      } catch (err) {
        if (isMounted) {
          setError(`Eroare viewer: ${(err as Error).message}`);
          setLoading(false);
        }
        console.error(err);
      }
    }

    initMap();
    return () => {
      isMounted = false;
    };
  }, [endpoint, layerName, imageSizeX, imageSizeY]);

  useEffect(() => {
    const m = mapInstance.current as { wmsLayer?: { setOpacity: (v: number) => void } } | null;
    m?.wmsLayer?.setOpacity(opacity / 100);
  }, [opacity]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#2B3440]">
      {error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-[14px] text-[#D5DEE6]">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#2B3440]/60 z-10">
              <LoaderCircleIcon className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <div ref={mapRef} className="flex-1 w-full h-full min-h-[400px]" />
        </>
      )}
    </div>
  );
}
