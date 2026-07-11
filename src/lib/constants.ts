export const ITEM_TYPES = [
  "map", "plate", "atlas_page", "chart", "text_page",
  "table", "legend", "technical", "composite", "other",
] as const;

export const GEOREF_STATUSES = ["none", "approximate", "accurate", "precise"] as const;

export const RESOURCE_TYPES = [
  "scan", "georeferenced_raster", "cog", "thumbnail", "vector",
  "wms", "wmts", "wfs", "kml", "geopackage", "flatgeobuf",
  "geojson", "geoparquet", "other",
] as const;

export const RESOURCE_ROLES = [
  "download", "view", "service", "thumbnail", "preview", "metadata",
] as const;

export const GEOREF_LABELS: Record<string, string> = {
  none: "Negeoreferențiat",
  approximate: "Georeferențiat",
  accurate: "Georeferențiat",
  precise: "Georeferențiat",
};

export const GEOREF_COLORS: Record<string, string> = {
  none: "bg-gray-100 text-gray-600",
  approximate: "bg-blue-100 text-blue-700",
  accurate: "bg-blue-100 text-blue-700",
  precise: "bg-blue-100 text-blue-700",
};

export const ITEM_TYPE_LABELS: Record<string, string> = {
  map: "Hartă",
  plate: "Planșă",
  atlas_page: "Pagină atlas",
  chart: "Grafic",
  text_page: "Text",
  table: "Tabel",
  legend: "Legendă",
  technical: "Tehnic",
  composite: "Compus",
  other: "Altul",
};

export const COLLECTION_TYPES = [
  "atlas", "serie", "fond", "colectie", "other",
] as const;

export const PER_PAGE = 24;
