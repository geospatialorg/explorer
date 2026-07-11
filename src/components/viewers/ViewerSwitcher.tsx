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
}

export function ViewerSwitcher({ resources, georefStatus, bbox, titilerUrl, geoserverUrl }: Props) {
  const cogResource = resources.find((r) => r.resourceType === "cog");
  const wmsResource = resources.find((r) => r.resourceType === "wms");
  const isGeoref = georefStatus !== "none";

  const tabs: Array<{ id: string; label: string; content: React.ReactNode }> = [];

  if (isGeoref && cogResource) {
    tabs.push({
      id: "geo",
      label: "Hartă georef.",
      content: (
        <GeoViewer
          cogUrl={cogResource.url}
          bbox={bbox}
          titilerUrl={titilerUrl}
        />
      ),
    });
  }

  if (wmsResource) {
    tabs.push({
      id: "scan",
      label: isGeoref ? "Scan original" : "Scanare",
      content: (
        <ScanWmsViewer
          wmsUrl={wmsResource.url}
          layerName={wmsResource.layerName ?? ""}
          geoserverUrl={geoserverUrl}
        />
      ),
    });
  }

  if (tabs.length === 0) {
    return (
      <div className="flex-1 min-h-[400px] flex items-center justify-center bg-muted rounded-lg text-muted-foreground text-sm">
        Nu există resurse vizualizabile pentru acest item.
      </div>
    );
  }

  if (tabs.length === 1) {
    return <div className="flex-1 min-h-[400px]">{tabs[0].content}</div>;
  }

  return (
    <Tabs defaultValue={tabs[0].id} className="flex flex-col h-full">
      <TabsList className="mb-2 self-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0">
          <div className="h-full min-h-[400px]">{tab.content}</div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
