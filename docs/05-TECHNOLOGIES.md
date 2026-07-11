# E. Tehnologii Recomandate

> **Scop:** Tehnologii pentru explorarea colecțiilor de date geo-spatial.org (eHarta + colecții mai recente).
> Aplicația **nu pregătește date** — doar consumă date deja pregătite, furnizate prin CSV-uri.

## E.1. Stack recomandat cu justificări specifice

| Strat | Tehnologie | Motivare specifică acest caz |
|---|---|---|
| **Framework web** | **Next.js 14+ (App Router)** | SSR pentru SEO (esențial pt. conținut patrimonial discoverable), ISR pentru pagini statice ale colecțiilor, API routes elimină backend separat, React Server Components optimizează încărcarea |
| **UI** | **TailwindCSS + shadcn/ui** | Componente accesibile, styling consistent, rapid de prototipat; shadcn e copy-paste (zero runtime overhead) |
| **Icoane** | **Lucide React** | Set consistent, lightweight, acoperă nevoile (download, map, layers etc.) |
| **Geo viewer (georef + scan)** | **OpenLayers 9+** | Singurul viewer web cu: reproiecții client-side (hărți istorice au proiecții non-standard), suport nativ WMS/WMTS/XYZ/GeoJSON, vector tiles, draw interactions. Leaflet nu suportă reproiecții native — descalificant pentru hărți istorice. Folosit atît pentru tile-uri TiTiler (georef) cît și WMS GeoServer (scanări non-georef, EPSG:404000) |
| **Vector viewer** | **MapLibre GL JS** | WebGL rendering performant pentru date vectoriale mari, styling expresiv (data-driven), popup-uri interactive, suport MVT nativ. Alternativa OpenLayers funcționează dar MapLibre e superior pe vector styling |
| **Bază de date** | **PostgreSQL 16 + PostGIS 3.4** | Spatial queries (ST_Intersects pe bbox/footprint), full-text search cu ranking, JSONB pentru metadate flexibile, pg_trgm pentru fuzzy match pe toponime cu ortografii istorice variabile |
| **Full-text search (MVP)** | **PostgreSQL tsvector + pg_trgm** | Zero infrastructură suplimentară. pg_trgm e excelent pentru toponime istorice: „Bucuresci" ≈ „București", „Braschow" ≈ „Brașov". Suficient pînă la ~50K items |
| **Full-text search (v2)** | **Meilisearch** | Typo tolerance, faceted search, search-as-you-type, lightweight (un singur binary Rust). Mai ușor decît Elasticsearch, suficient pentru acest caz |
| **COG tile serving** | **TiTiler** | Python/FastAPI, servire dinamică tile-uri XYZ din Cloud Optimized GeoTIFF. Lightweight, Docker-ready, suportă rescaling/recoloring on-the-fly. Citește COG-uri direct de pe disk (mount Docker volume) |
| **WMS scanări non-georef** | **GeoServer (extern)** | `https://services.geo-spatial.org/geoserver` — serviciu WMS deja existent, nu e administrat de aplicație. Se folosește cu EPSG:404000 pentru vizualizarea scanărilor fără georeferențiere |
| **Vector tile serving** | **pg_featureserv** (MVP) / **Martin** (v2) | pg_featureserv: OGC API Features direct din PostGIS, zero config. Martin: MVT tiles din PostGIS, Rust, extrem de performant |
| **CSV parsing** | **Papa Parse** (browser) + **csv-parse** (Node.js) | Streaming parser, encoding detection, fișiere mari |
| **Validare** | **Zod** | Schema validation TypeScript-native, folosit și server-side și client-side, mesaje de eroare clare |
| **ORM** | **Drizzle ORM** | Type-safe, lightweight, SQL-first (nu ascunde query-urile), suport PostGIS via extensii custom, migrări integrate |
| **Containerizare** | **Docker + Docker Compose** | TiTiler, PostgreSQL — imagini Docker oficiale. Fișierele sînt pe disk (volume mount) |

## E.2. De ce NU alte tehnologii

| Alternativă | De ce nu pentru acest caz |
|---|---|
| **Leaflet** | Nu suportă reproiecții native. Hărțile istorice au frecvent proiecții non-Web Mercator (Bonne, Cassini, stereografică). OpenLayers rezolvă acest lucru cu `ol/proj` + proj4js |
| **OpenSeadragon** | Nu e necesar — scanările non-georef se vizualizează prin WMS GeoServer cu EPSG:404000, folosind OpenLayers. Nu avem nevoie de deep zoom dedicat pe imagini |
| **Cantaloupe / IIPImage (IIIF)** | Nu e necesar — nu folosim servere de imagini dedicate. Scanările se servesc prin WMS GeoServer deja existent |
| **MinIO / S3** | Nu e necesar — fișierele sînt pe disk, locațiile furnizate prin CSV. TiTiler citește direct de pe disk via volume mount |
| **GDAL (în aplicație)** | Aplicația nu pregătește date. Conversia COG, extragerea bbox — toate se fac extern de echipa de administrare |
| **sharp (thumbnail generation)** | Thumbnails-urile sînt furnizate de echipa admin prin CSV, nu generate de aplicație |
| **Elasticsearch** | Overhead operațional nejustificat (cluster JVM, tuning, monitorizare). PostgreSQL FTS + pg_trgm acoperă cazul pînă la zeci de mii de items. Meilisearch e upgrade-ul natural |
| **MongoDB** | Modelul relațional collection→item→resource se pretează PostgreSQL. PostGIS e net superior MongoDB geospatial pentru queries complexe |
| **Express / Fastify separat** | Next.js API routes elimină necesitatea unui backend separat. Un server suplimentar înseamnă overhead de deployment și sincronizare |
| **Remix / SvelteKit** | Ecosistem React mai mare, mai multe componente disponibile (OpenLayers wrappers, shadcn). Svelte ar necesita rescrierea multor integrări |
| **Django / Flask** | Stack Python separat ar adăuga complexitate. Next.js unifică frontend + API. Python rămîne doar pentru TiTiler (container separat) |
| **QGIS Server** | Desktop-oriented, nu optimizat pentru servire web de tile-uri. TiTiler e proiectat specific pentru COG serving |

## E.3. Librării frontend suplimentare

| Librărie | Scop | Justificare |
|---|---|---|
| `@tanstack/react-query` | Data fetching + cache | Cache inteligent, invalidare, optimistic updates. Esențial pentru API calls frecvente (search, filtre) |
| `@tanstack/react-table` | Tabel atribute vectoriale | Sorting, filtering, pagination — cel mai matur table library React |
| `nuqs` | URL state management | Sincronizează starea filtrelor/sortării cu URL query params. Esențial pentru bookmarkable search |
| `react-resizable-panels` | Split view | Redimensionare panouri viewer/metadata |
| `proj4` | Reproiecții | Folosit de OpenLayers pentru proiecții non-standard |
| `rc-slider` | Range slider | Slider dublu pentru intervale temporale |
| `slugify` + `transliteration` | Slug generation | Transliterare corectă diacritice românești |
| `date-fns` | Date formatting | Lightweight, tree-shakable |

## E.4. Dependențe sistem (containers)

```yaml
# docker-compose.yml - servicii
services:
  app:         # Next.js 14+ (servit la /explorer)
  db:          # PostgreSQL 16 + PostGIS 3.4
  titiler:     # ghcr.io/developmentseed/titiler:latest
  # Faza 2:
  meilisearch: # getmeili/meilisearch:latest
  martin:      # maplibre/martin:latest
```

**Servicii externe (nu în Docker Compose):**
- **GeoServer WMS:** `https://services.geo-spatial.org/geoserver` — scanări non-georef cu EPSG:404000
