# K. Stack Recomandat & Întrebări Deschise

---

## K.1. Stack recomandat MVP

| Componentă | Tehnologie | Versiune |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | Next.js (App Router) | 14+ |
| Limbaj | TypeScript | 5+ |
| UI | TailwindCSS + shadcn/ui + Lucide | latest |
| Geo viewer (georef) | OpenLayers | 9+ |
| Geo viewer (scan non-georef) | OpenLayers + WMS GeoServer | 9+ |
| Vector viewer | MapLibre GL JS | 4+ |
| Bază de date | PostgreSQL + PostGIS | 16 + 3.4 |
| Full-text search | PostgreSQL tsvector + pg_trgm | (integrat) |
| COG/raster tile server | TiTiler | latest |
| WMS scanări non-georef | GeoServer existent (extern) | — |
| ORM | Drizzle ORM | latest |
| Validare | Zod | latest |
| CSV parsing | csv-parse (Node) | latest |
| Data fetching | @tanstack/react-query | 5+ |
| URL state | nuqs | latest |
| Deploy | Docker Compose | v2 |

> **Notă importantă:** Aplicația **nu se ocupă de pregătirea datelor** (conversie COG, generare thumbnails din raster, etc.). Datele (COG-uri, thumbnails, fișiere scanate) sînt pregătite în prealabil de echipa de administrare. Aplicația primește prin CSV-uri endpoint-urile și locațiile pe disk unde se găsesc resursele.

**Servicii Docker Compose MVP:**

```yaml
services:
  app:       # Next.js (servit la /explorer)
  db:        # postgres:16-postgis-3.4
  titiler:   # ghcr.io/developmentseed/titiler:latest
```

**Servicii externe (nu administrate de aplicație):**
- **GeoServer:** `https://services.geo-spatial.org/geoserver` — servire WMS pentru hărți scanate fără georeferențiere (EPSG:404000)

**Total RAM estimat:** ~1.5-2 GB (Next.js ~512MB, PostgreSQL ~512MB, TiTiler ~256MB)

---

## K.2. Stack recomandat producție

Tot ce e în MVP plus:

| Componentă | Tehnologie | Adăugat în faza |
|---|---|---|
| Full-text search | Meilisearch | 2 |
| Vector tiles | Martin | 2 |
| OGC API Features | pg_featureserv | 2 |
| Cache | Redis | 3 |
| CDN | Cloudflare / CloudFront | 3 |
| OGC Gateway | pygeoapi | 3 |
| Monitoring | Prometheus + Grafana | 3 |
| Auth | NextAuth.js | 3 |
| Reverse proxy | Caddy / nginx | 2 |

**Servicii Docker Compose producție:**

```yaml
services:
  app:           # Next.js (servit la /explorer)
  db:            # PostgreSQL + PostGIS
  redis:         # Redis 7
  titiler:       # TiTiler
  meilisearch:   # Meilisearch
  martin:        # Martin MVT
  pgfeatureserv: # pg_featureserv
  pygeoapi:      # pygeoapi
  prometheus:    # Prometheus
  grafana:       # Grafana
  caddy:         # Reverse proxy + TLS
```

**Total RAM estimat:** ~4-6 GB

---

## K.3. Întrebări deschise — Decizii pentru product owner

### Prioritate ridicată (trebuie răspuns înainte de Faza 1)

| # | Întrebare | Opțiuni | Impact |
|---|---|---|---|
| 1 | **Cîte colecții și items sînt estimate inițial?** | 10/500? 50/5000? 100/50000? | Dimensionarea DB, search, storage, paginare |
| 2 | **Datele (scanări, COG-uri) vor fi găzduite intern sau linkuri externe?** | Intern (MinIO/S3), extern (URL-uri existente), mixt | Dimensionare storage, pipeline thumbnails, CORS |
| 3 | **Există deja un CSV cu inventarul? Ce coloane are?** | Da/Nu | Mapare CSV → model de date, efort de transformare |
| 4 | **Care e dimensiunea medie a unei scanări?** | <10MB, 10-100MB, 100MB-1GB, >1GB | Stocare, bandwidth, decizia DZI vs IIIF vs imagine directă |
| 5 | **Limba interfeței?** | RO only, RO + EN, full i18n | Efort UI, texte, routing |
| 6 | **Cine administrează conținutul?** | 1 persoană, echipă mică, comunitate | Complexitate admin UI, roluri |
| 7 | **Există un domeniu deja stabilit?** | eharta.ro, altceva | Configurare DNS, TLS, permalink-uri permanente |
| 8 | **Unde se va deploya aplicația?** | Server propriu, VPS, cloud (AWS/GCP/Azure) | Configurare Docker, storage, CDN, costuri |

### Prioritate medie (poate fi decis pe parcursul Fazei 1)

| # | Întrebare | Opțiuni | Impact |
|---|---|---|---|
| 9 | **Există deja servicii WMS/WMTS publicate pe care trebuie să le integrăm?** | Da/Nu, lista | Integrare viewer, CORS proxy |
| 10 | **Se dorește workflow de validare (draft→review→publish)?** | Da (complet), Nu (publish direct) | Complexitate admin, MVP poate fi fără workflow |
| 11 | **Se dorește autentificare publică sau doar admin?** | Public deschis + admin protejat, Public cu conturi | Complexitate auth, MVP poate fi fără auth public |
| 12 | **Datele vectoriale derivate — în ce format sînt?** | GeoPackage, Shapefile, GeoJSON, PostGIS deja | Pipeline import vector, conversii |
| 13 | **Se dorește bulk download (toată colecția)?** | Da/Nu | Generare ZIP, bandwidth, storage |
| 14 | **Care e bugetul de hosting lunar estimat?** | <50€, 50-200€, >200€ | Dimensionare server, CDN |

### Prioritate scăzută (poate fi decis în Faza 2-3)

| # | Întrebare | Opțiuni | Impact |
|---|---|---|---|
| 15 | **Se dorește integrare Europeana / alte agrgatoare?** | Da/Nu | OAI-PMH, metadata mapping |
| 16 | **Se doresc statistici de utilizare (analytics)?** | Da/Nu | Plausible, Matomo, sau nimic |
| 17 | **Se dorește un API public documentat (pentru terți)?** | Da/Nu | Swagger/OpenAPI, rate limiting |
| 18 | **Se doresc notificări la actualizări?** | Da/Nu | Email, RSS feed |
| 19 | **Există cerințe de accesibilitate (WCAG)?** | Nivel A, AA, fără | Efort UI, testing |

---

## K.4. Diagrama arhitecturală de ansamblu (toate fazele)

```mermaid
graph TB
    subgraph Users["Utilizatori"]
        Browser["Browser Web"]
        GISClient["Client GIS<br/>(QGIS, ArcGIS)"]
        Developer["Developer<br/>(API consumer)"]
    end

    subgraph CDN["CDN / Edge"]
        CF["Cloudflare / CloudFront"]
    end

    subgraph Frontend["Frontend (Next.js @ /explorer)"]
        Pages["Pages SSR/ISR"]
        APIRoutes["API Routes"]
        OL["OpenLayers<br/>(georef + scan)"]
        ML["MapLibre GL"]
    end

    subgraph Backend["Backend Services (Docker)"]
        TT["TiTiler<br/>COG Tiles"]
        MART["Martin<br/>MVT Tiles"]
        PGF["pg_featureserv<br/>OGC API Features"]
        PYGE["pygeoapi<br/>OGC Gateway"]
        MS["Meilisearch<br/>Search"]
    end

    subgraph External["Servicii Externe (nu administrate)"]
        GS["GeoServer<br/>services.geo-spatial.org<br/>WMS EPSG:404000"]
        DISK["Fișiere pe disk<br/>(COG, scanări, thumbnails)"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL<br/>+ PostGIS"]
        RD["Redis<br/>Cache"]
    end

    subgraph Monitoring["Monitoring"]
        PROM["Prometheus"]
        GRAF["Grafana"]
    end

    Browser --> CF --> Pages
    Browser --> CF --> APIRoutes
    GISClient --> PYGE
    Developer --> APIRoutes

    OL --> TT
    OL --> GS
    OL --> PGF
    ML --> MART

    APIRoutes --> PG
    APIRoutes --> MS
    APIRoutes --> RD

    TT --> DISK
    MART --> PG
    PGF --> PG
    PYGE --> PG
    PYGE --> TT

    PROM --> GRAF
```

---

## K.5. Structura de directoare recomandate (proiect Next.js)

```
geo-spatial-explorer/
├── docs/                          # Documentație (acest plan)
├── docker/                        # Dockerfile-uri custom
│   └── app.Dockerfile
├── docker-compose.yml             # Orchestrare servicii
├── docker-compose.prod.yml        # Override producție
├── .env                           # Variabile de mediu (vezi K.7)
├── .env.example                   # Template variabile de mediu
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── explorer/              # Toate rutele sub /explorer
│   │   │   ├── page.tsx           # Homepage /explorer
│   │   │   ├── collections/
│   │   │   │   ├── page.tsx       # Lista colecții
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx   # Pagină colecție
│   │   │   │       └── [itemSlug]/
│   │   │   │           └── page.tsx   # Pagină item
│   │   │   ├── search/
│   │   │   │   └── page.tsx       # Căutare
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   └── api/               # API Routes
│   │   │       ├── collections/
│   │   │       ├── items/
│   │   │       ├── search/
│   │   │       ├── spatial/
│   │   │       ├── tiles/
│   │   │       └── admin/
│   │   │           └── ingest/    # CSV import endpoints
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/                # Header, Footer, Breadcrumbs
│   │   ├── collections/           # CollectionCard, CollectionGrid
│   │   ├── items/                 # ItemCard, ItemGrid, MetadataPanel
│   │   ├── viewers/               # GeoViewer, ScanWmsViewer, VectorViewer, ViewerSwitcher
│   │   ├── search/                # SearchBar, FilterPanel, SearchResults
│   │   └── shared/                # ResourceList, Badges, Pagination
│   │
│   ├── lib/
│   │   ├── db/                    # Drizzle schema, queries, migrations
│   │   │   ├── schema.ts
│   │   │   ├── queries/
│   │   │   └── migrations/
│   │   ├── ingest/                # CSV parser, validator, importer
│   │   │   ├── csv-parser.ts
│   │   │   ├── validator.ts
│   │   │   └── importer.ts
│   │   ├── search/                # Search queries, facets
│   │   ├── geo/                   # Spatial utilities, bbox, projections
│   │   ├── config.ts              # Configurare centralizată din .env
│   │   ├── slugify.ts             # Slug generation cu transliterare
│   │   └── constants.ts           # Enums, lookup tables
│   │
│   ├── hooks/                     # React hooks custom
│   │   ├── use-search.ts
│   │   ├── use-viewer.ts
│   │   └── use-url-state.ts
│   │
│   └── types/                     # TypeScript types
│       ├── collection.ts
│       ├── item.ts
│       ├── resource.ts
│       └── api.ts
│
├── public/
│   ├── basemaps/                  # Basemap thumbnails
│   └── icons/
│
├── scripts/
│   ├── ingest.ts                  # CLI script import CSV
│   ├── validate-csv.ts            # Standalone CSV validation
│   └── seed.ts                    # Seed data de test
│
├── data/                          # CSV-uri administrare (gitignored în prod)
│   ├── collections.csv            # Definire colecții (UUID, titlu, descriere, tag-uri, thumbnail)
│   ├── items.csv                  # Items cu endpoint-uri și locații pe disk
│   └── resources.csv              # Resurse asociate items
│
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## K.6. Decizii confirmate (răspunsuri la întrebările deschise)

> Data: 2026-04-05. Răspunsuri furnizate de proprietarul de produs.

| # | Întrebare | Răspuns | Impact pe implementare |
|---|---|---|---|
| 1 | Volum estimat | **10-50 colecții** | PostgreSQL FTS suficient, Meilisearch devine opțional |
| 2 | Stocare fișiere | **Pe disk (locații furnizate prin CSV)** | Fără MinIO/S3; TiTiler citește direct de pe disk; thumbnails furnizate de echipa admin |
| 3 | CSV existent | **Da, mostre variate** | Validator comun; colecțiile se creează tot via CSV |
| 4 | Dimensiune scanări | **10-100 MB** | Scanări non-georef vizualizate via WMS GeoServer (EPSG:404000); georef via TiTiler |
| 5 | Limbă interfață | **RO + EN** | i18n din Faza 1 (next-intl); conținut în limba originală |
| 6 | Admin | **Echipă mică** | Administrare prin CSV-uri; fără workflow complex de aprobare |
| 7 | Servicii existente | **geo-spatial.org** | WMS GeoServer `https://services.geo-spatial.org/geoserver` pentru scanări non-georef (EPSG:404000) |
| 8 | Hosting | **Server propriu** | Docker Compose + Caddy (reverse proxy + TLS); aplicația servită la `/explorer` |
| 9 | Integrare servicii externe | **Da** | WMS/WMTS/WFS de pe geo-spatial.org → `resources` table; GeoServer pentru scanări |
| 10 | Workflow validare | **Nu** | Import → publish direct; `validation_status` simplificat (`draft`/`published`) |
| 11 | Acces public | **Public deschis** | Fără autentificare pentru citire; admin protejat cu parolă |
| 12 | Formate vectoriale | **Toate + WFS** | Adăugat `wfs` în `resource_type` enum |
| 13 | Bulk download | **Da (dacă <500 GB)** | Generare ZIP per colecție; warning dacă >500 GB |
| 14 | Buget hosting | **Zero (server propriu)** | Docker Compose pe server existent |
| 15 | Europeana | **Nu** | OAI-PMH exclus din plan |
| 16 | Analytics | **Google Analytics existent** | `gtag.js` via Next.js Script component; `GA_MEASUREMENT_ID` din env |
| 17 | API public documentat | **Nu** | Fără Swagger/OpenAPI în planul curent |
| 18 | Notificări | **Nu** | Fără RSS / email |
| 19 | WCAG | **Nu** | Fără cerințe formale de accesibilitate |

### Principii arhitecturale cheie

1. **Aplicația nu pregătește date.** Conversia în COG, generarea thumbnails, procesarea rasterelor — toate sînt responsabilitatea echipei de administrare, în afara aplicației. Aplicația doar consumă date deja pregătite.
2. **Administrare prin CSV-uri.** Colecțiile se creează pe baza unui `collections.csv` (UUID, titlu, descriere, tag-uri, thumbnail). Items-urile și resursele se furnizează prin `items.csv` / `resources.csv` cu endpoint-uri și locații pe disk.
3. **Fără Dragon / servere de imagini.** Nu se folosesc Cantaloupe, IIPImage, OpenSeadragon sau orice server IIIF. Scanările non-georef se vizualizează exclusiv prin WMS GeoServer cu EPSG:404000.
4. **Preview georeferențiat = TiTiler.** Singura metodă de preview pentru datele georeferențiate (COG/GeoTIFF).
5. **Preview scanări non-georef = WMS GeoServer.** Endpoint: `https://services.geo-spatial.org/geoserver`, EPSG:404000.
6. **Aplicația rulează la `/explorer`** indiferent de domeniu (localhost, services.geo-spatial.org, etc.).
7. **Configurare prin `.env`** — toate detaliile (DB, TiTiler URL, GeoServer URL, base path) sînt configurabile.

### Modificări față de planul inițial

**Adăugate / modificate:**
- **Scop extins:** de la eHarta la colecțiile geo-spatial.org (eHarta + colecții mai recente)
- `resource_type` enum: adăugat `wfs` (lângă `wms`, `wmts`)
- `validation_status`: simplificat la `draft` / `published` (eliminat `reviewed`, `validated`, `rejected`)
- Google Analytics: `<Script src="https://www.googletagmanager.com/gtag/js?id=...">` în `layout.tsx`
- Bulk download: endpoint `/explorer/api/collections/:slug/download` → generează ZIP on-demand
- Caddy în loc de nginx ca reverse proxy (mai simplu, TLS automat)
- i18n: `next-intl` din Faza 1 pentru RO+EN
- **WMS GeoServer** pentru vizualizarea scanărilor fără georeferențiere (EPSG:404000)
- **Colecții create prin CSV** cu UUID, titlu, descriere, tag-uri, thumbnail
- **Base path `/explorer`** pentru toate rutele aplicației
- **Fișier `.env`** pentru configurare PostgreSQL, TiTiler, GeoServer, etc.

**Eliminate din plan:**
- Workflow editorial complex (draft→review→validated→published)
- Europeana / OAI-PMH
- RSS feed / email notifications
- WCAG testing
- **MinIO / S3** (fișierele sînt pe disk, locații furnizate prin CSV)
- **GDAL în aplicație** (conversia COG se face extern, nu de aplicație)
- **OpenSeadragon / DZI** (scanările se vizualizează via WMS GeoServer)
- **Cantaloupe / IIIF** (nu e nevoie de server de imagini)
- **sharp / thumbnail generation** (thumbnails furnizate de admin prin CSV)
- **Pipeline de pregătire date** (totul pregătit extern)

### Date reale confirmate (atlas-agricol-1938)

| Aspect | Realitate confirmată |
|---|---|
| Scanări | 104 fișiere JPEG, 3-5 MB fiecare |
| Georef | 43 fișiere GeoTIFF, 40-50 MB fiecare |
| Total storage colecție | ~2.2 GB (georef) + ~400 MB (scan) = ~2.6 GB |
| UUID-uri | Deja existente în CSV → se folosesc as-is ca ID în DB |
| Limba originală | Franceză (atlas 1938), cu traducere în română în CSV |
| Strategie titlu | `title` = română, `subtitle` = franceză originală |
| Scanări non-georef | Se vizualizează prin WMS GeoServer cu EPSG:404000 |
| Georef preview | Se vizualizează prin TiTiler (COG-uri pregătite extern) |

---

## K.7. Configurare `.env`

Toate setările aplicației sînt centralizate în fișierul `.env`:

```bash
# ============================================================
# Bază de date
# ============================================================
DATABASE_URL=postgresql://explorer:password@localhost:5432/geospatial_explorer
POSTGRES_USER=explorer
POSTGRES_PASSWORD=password
POSTGRES_DB=geospatial_explorer

# ============================================================
# Aplicație
# ============================================================
NEXT_PUBLIC_BASE_PATH=/explorer
NEXT_PUBLIC_SITE_TITLE=geo-spatial.org Explorer
NEXT_PUBLIC_SITE_URL=https://services.geo-spatial.org/explorer
NODE_ENV=production

# ============================================================
# TiTiler (preview date georeferențiate)
# ============================================================
TITILER_URL=http://titiler:8000
NEXT_PUBLIC_TITILER_URL=http://localhost:8000
# Calea pe disk unde TiTiler găsește COG-urile (mount Docker)
TITILER_DATA_DIR=/data/cog

# ============================================================
# GeoServer (WMS scanări non-georef, EPSG:404000)
# ============================================================
NEXT_PUBLIC_GEOSERVER_URL=https://services.geo-spatial.org/geoserver
GEOSERVER_WMS_SRS=EPSG:404000

# ============================================================
# CSV Import
# ============================================================
CSV_COLLECTIONS_PATH=./data/collections.csv
CSV_ITEMS_PATH=./data/items.csv
CSV_RESOURCES_PATH=./data/resources.csv

# ============================================================
# Analytics
# ============================================================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================================
# Admin
# ============================================================
ADMIN_PASSWORD=change-me-in-production

# ============================================================
# i18n
# ============================================================
DEFAULT_LOCALE=ro
SUPPORTED_LOCALES=ro,en
```
