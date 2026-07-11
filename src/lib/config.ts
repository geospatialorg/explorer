export const config = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  siteTitle: process.env.NEXT_PUBLIC_SITE_TITLE || "geo-spatial.org Explorer",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  titilerUrl: process.env.NEXT_PUBLIC_TITILER_URL || "http://localhost:8000",
  geoserverUrl:
    process.env.NEXT_PUBLIC_GEOSERVER_URL ||
    "https://services.geo-spatial.org/geoserver",
  geoserverWmsSrs: process.env.GEOSERVER_WMS_SRS || "EPSG:404000",
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  defaultLocale: process.env.DEFAULT_LOCALE || "ro",
};

export function buildUrl(path: string): string {
  return `${config.basePath}${path}`;
}
