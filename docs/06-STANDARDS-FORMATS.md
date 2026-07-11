# F. Suport pentru Standarde și Formate

> **Principiu:** Aplicația nu pregătește date (fără conversie COG, fără generare thumbnails). Toate fișierele sînt furnizate de echipa admin prin CSV-uri cu locații pe disk / endpoint-uri.

## F.1. Matrice formate și integrare

| Format / Standard | Rol | Servire | Viewer | Faza |
|---|---|---|---|---|
| **COG** | Raster georef optimizat | TiTiler → XYZ tiles (de pe disk) | OpenLayers TileLayer | 1 |
| **GeoTIFF** | Raster georef clasic | Download direct (disk) | — (download only) | 1 |
| **WMS (georef)** | Serviciu OGC raster | Link extern | OpenLayers WMS source | 1 |
| **WMS (scan non-georef)** | Vizualizare scanări | GeoServer `services.geo-spatial.org` EPSG:404000 | OpenLayers WMS source | 1 |
| **WMTS** | Serviciu OGC tile-uri | Link extern | OpenLayers WMTS source | 1 |
| **GeoJSON** | Vector lightweight | API / fișier static | MapLibre / OpenLayers | 1 |
| **FlatGeobuf** | Vector streaming | Fișier static pe disk | OpenLayers flatgeobuf | 2 |
| **GeoPackage** | Vector/raster pachet | Download (disk) | — (download only) | 1 |
| **GeoParquet** | Vector columnar | Download (disk) | DuckDB-WASM (Faza 3) | 3 |
| **KML** | Vector legacy | Generat din PostGIS | — (download only) | 2 |
| **OGC API Features** | Vector API modern | pg_featureserv | MapLibre / OL | 2 |
| **MVT** | Vector tiles | Martin | MapLibre nativ | 2 |
| **JSON-LD / Schema.org** | SEO / discoverability | Next.js `<head>` | — | 1 |

## F.2. COG — Strategie detaliată

### De ce COG?

Cloud Optimized GeoTIFF permite:
- **HTTP range requests** — TiTiler citește doar tile-urile necesare, nu tot fișierul
- **Stocare pe disk** — TiTiler citește direct de pe disk via Docker volume mount
- **Overview-uri integrate** — zoom out rapid fără a citi toți pixelii
- **Compresie** — DEFLATE/ZSTD reduc dimensiunea cu 30-60%

> **Notă:** Conversia GeoTIFF → COG este responsabilitatea echipei de administrare, nu a aplicației. Aplicația primește prin CSV locația pe disk a COG-ului deja pregătit.

### TiTiler endpoints

```
# Tile XYZ (COG pe disk, montat ca volume în TiTiler)
GET /cog/tiles/{z}/{x}/{y}.png?url=file:///data/cog/collection/item.tif

# Metadata (bounds, statistics)
GET /cog/info?url=file:///data/cog/collection/item.tif

# Bounds
GET /cog/bounds?url=file:///data/cog/collection/item.tif
```

### Integrare OpenLayers

```javascript
const cogLayer = new TileLayer({
  source: new XYZ({
    url: `${TITILER_URL}/cog/tiles/{z}/{x}/{y}.png?url=${encodeURIComponent(cogDiskPath)}`,
    crossOrigin: 'anonymous',
  }),
  opacity: 0.8, // controlat de slider
});
```

## F.3. WMS GeoServer — Vizualizare scanări non-georeferențiate

### De ce WMS cu EPSG:404000?

- **Scanările fără georeferențiere** nu au coordonate reale — EPSG:404000 folosește coordonate în pixeli (image coordinates)
- **GeoServer-ul de pe `services.geo-spatial.org`** este deja existent și configurat — nu e administrat de aplicație
- **OpenLayers** consumă WMS nativ — un singur viewer (OpenLayers) acoperă atît georef cît și non-georef

### Endpoint

```
# WMS GetMap
GET https://services.geo-spatial.org/geoserver/wms?
    SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap
    &LAYERS={layer_name}
    &SRS=EPSG:404000
    &FORMAT=image/png
    &BBOX={minx},{miny},{maxx},{maxy}
    &WIDTH=256&HEIGHT=256
```

### Integrare OpenLayers

```javascript
const scanWmsLayer = new TileLayer({
  source: new TileWMS({
    url: `${GEOSERVER_URL}/wms`,
    params: {
      LAYERS: layerName,  // din resources.layer_name
      FORMAT: 'image/png',
      SRS: 'EPSG:404000',
    },
  }),
});
```

### Cum se determină ce viewer se folosește

| Situație | Viewer | Sursă date |
|---|---|---|
| Item georeferențiat + are COG | **GeoViewer** (OpenLayers + TiTiler) | COG de pe disk |
| Item georeferențiat + are WMS extern | **GeoViewer** (OpenLayers + WMS) | WMS extern |
| Item non-georeferențiat + are WMS GeoServer | **ScanWmsViewer** (OpenLayers + WMS EPSG:404000) | GeoServer |
| Item non-georeferențiat + fără WMS | **Imagine statică** (thumbnail) | Thumbnail furnizat prin CSV |

## F.4. FlatGeobuf — Strategie detaliată

### De ce FlatGeobuf?

- **Streaming** — HTTP range requests, similar cu COG dar pentru vector
- **Spatial index** — Hilbert R-tree integrat → filtrare spațială fără a descărca tot fișierul
- **Performant** — binary format, mult mai rapid decît GeoJSON pentru date mari
- **OpenLayers** — suport integrat via `flatgeobuf` npm package

### Generare FlatGeobuf

> **Notă:** Generarea FlatGeobuf este responsabilitatea echipei de administrare, nu a aplicației. Exemple de conversie:

```bash
# Din GeoPackage
ogr2ogr -f FlatGeobuf output.fgb input.gpkg layer_name

# Din PostGIS
ogr2ogr -f FlatGeobuf output.fgb \
  PG:"host=localhost dbname=geospatial" \
  -sql "SELECT * FROM vector_layer_name"
```

### Încărcare în OpenLayers cu filtrare spațială

```javascript
import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js';

const vectorSource = new VectorSource({
  loader: async function(extent, resolution, projection) {
    const bbox = transformExtent(extent, projection, 'EPSG:4326');
    const iter = deserialize(fgbUrl, {
      bbox: { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3] }
    });
    for await (const feature of iter) {
      const olFeature = new GeoJSON().readFeature(feature, {
        featureProjection: projection,
      });
      vectorSource.addFeature(olFeature);
    }
  },
  strategy: bboxStrategy,
});
```

## F.5. GeoParquet — Strategie (Faza 3)

### De ce GeoParquet?

- **Columnar format** — excelent pentru analytics și queries selective pe atribute
- **Compresie eficientă** — Snappy/Zstd, fișiere 5-10x mai mici decît GeoJSON
- **Ecosistem Python** — geopandas, pyarrow, DuckDB
- **DuckDB-WASM** — posibilitate query în browser (experimental)

### Vizualizare în browser (Faza 3, experimental)

```javascript
import * as duckdb from '@duckdb/duckdb-wasm';

const conn = await db.connect();
await conn.query(`
  INSTALL spatial; LOAD spatial;
  SELECT ST_AsGeoJSON(geom), name, population
  FROM read_parquet('${parquetUrl}')
  WHERE ST_Intersects(geom, ST_MakeEnvelope(25, 44, 29, 46))
`);
```

## F.6. OGC API — Strategie (Faza 2-3)

### pg_featureserv (Faza 2)

Expune automat tabelele PostGIS ca OGC API Features:

```
GET /collections                          # Lista colecții (tabele)
GET /collections/{table}/items            # Features paginat
GET /collections/{table}/items/{id}       # Feature individual
GET /collections/{table}/items?bbox=...   # Filtrare spațială
GET /collections/{table}/items?prop=val   # Filtrare pe atribute
```

### pygeoapi (Faza 3)

Gateway OGC complet:
- OGC API Features
- OGC API Records (catalog)
- OGC API Tiles
- WMS / WMTS proxy
- CSW (legacy)

Configurare YAML care agregă toate sursele de date într-un singur endpoint OGC.

## F.7. JSON-LD / Schema.org (Faza 1)

Fiecare pagină item include în `<head>`:

```json
{
  "@context": "https://schema.org",
  "@type": "Map",
  "identifier": "atlas-militar-1916/plansa-xii-braila",
  "name": "Planșa XII — Brăila și Galați",
  "description": "Planșă topografică militară...",
  "dateCreated": "1916",
  "inLanguage": "ro",
  "creator": {
    "@type": "Organization",
    "name": "Marele Stat Major"
  },
  "spatialCoverage": {
    "@type": "Place",
    "name": "Brăila, Galați",
    "geo": {
      "@type": "GeoShape",
      "box": "44.8 27.5 45.6 28.2"
    }
  },
  "isPartOf": {
    "@type": "Collection",
    "name": "Atlas Militar 1916",
    "url": "https://services.geo-spatial.org/explorer/collections/atlas-militar-1916"
  },
  "thumbnailUrl": "/explorer/api/items/atlas-militar-1916/plansa-xii-braila/thumbnail",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "encoding": [
    {
      "@type": "MediaObject",
      "contentUrl": "https://storage.example.org/scans/...",
      "encodingFormat": "image/tiff",
      "name": "Scan original"
    }
  ]
}
```

Pagina colecție folosește `@type: Collection` cu `hasPart` listînd items.
