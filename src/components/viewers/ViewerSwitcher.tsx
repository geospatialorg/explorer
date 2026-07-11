"use client";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Resource } from "@/lib/db/schema";

const GeoViewer = dynamic(() => import("./GeoViewer").then((m) => ({ default: m.GeoViewer })), { ssr: false, loading: () => <ViewerPlaceholder /> });
const ScanWmsViewer = dynamic(() => import("./ScanWmsViewer").then((m) => ({ default: m.ScanWmsViewer })), { ssr: false, loading: () => <ViewerPlaceholder /> });

function ViewerPlaceholder() {
  return <div className="flex-1 min-h-[400px] bg-muted rounded-lg animate-pulse" />;
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

export function ViewerSwitcher({ resources, georefStatus, bbox, titilerUrl, geoserverUrl, imageSizeX, imageSizeY }: Props) {
  const cogResource = resources.find((r) => r.resourceType === "cog");
  const wmsScanResource = resources.find((r) => r.resourceType === "wms_scan");
  const wmsResource = resources.find((r) => r.resourceType === "wms");
  const isGeoref = georefStatus !== "none";

  const tabs: Array<{ id: string; label: string; content: React.ReactNode }> = [];

  if (wmsScanResource) {
    tabs.push({
      id: "scan",
      label: "Scanare",
      content: (
        <ScanWmsViewer
          wmsUrl={wmsScanResource.url}
          layerName={wmsScanResource.layerName ?? ""}
          geoserverUrl={geoserverUrl}
          imageSizeX={imageSizeX}
          imageSizeY={imageSizeY}
        />
      ),
    });
  } else if (wmsResource) {
    tabs.push({
      id: "scan",
      label: "Hartă scanată",
      content: (
        <ScanWmsViewer
          wmsUrl={wmsResource.url}
          layerName={wmsResource.layerName ?? ""}
          geoserverUrl={geoserverUrl}
          imageSizeX={imageSizeX}
          imageSizeY={imageSizeY}
        />
      ),
    });
  }

  if (isGeoref && cogResource) {
    tabs.push({
      id: "geo",
      label: "Hartă georeferențiată",
      content: (
        <GeoViewer
          cogUrl={cogResource.url}
          bbox={bbox}
          titilerUrl={titilerUrl}
        />
      ),
    });
  }

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg text-muted-foreground text-sm">
        Nu există resurse vizualizabile pentru acest item.
      </div>
    );
  }

  return (
    <Tabs defaultValue={tabs[0].id} className="flex flex-col h-full">
      {tabs.length > 1 && (
        <TabsList className="mb-2 self-start">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      )}
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0 data-[state=inactive]:hidden">
          <div className="h-full">{tab.content}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
