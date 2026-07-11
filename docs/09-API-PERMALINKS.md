# I. API și Permalink-uri

> Toate rutele și API-urile sînt sub `/explorer`.

## I.1. Identificatori unici

| Nivel | Identificator intern | Identificator public | Exemplu |
|---|---|---|---|
| Colecție | UUID v4 | slug | `atlas-militar-1916` |
| Item | UUID v4 | slug compus | `atlas-militar-1916/plansa-xii-braila` |
| Resursă | UUID v4 | — (accesat via item) | — |

### Reguli slug

- **Generare:** transliterare (ă→a, ș→s, î→i, ț→t, â→a) + lowercase + non-alnum → `-` + dedup `--` + trim `-`
- **Unicitate:** global-unique, verificat la insert
- **Stabilitate:** odată creat, nu se schimbă. Dacă se schimbă → redirect 301 din slug-ul vechi
- **Sursă:** furnizat explicit în CSV (`slug` column) sau generat automat din `title`
- **Collision handling:** dacă slug-ul generat există deja → append suffix numeric (`-2`, `-3` etc.)

## I.2. URL Patterns — Pagini publice

| Pattern | Descriere | Rendering |
|---|---|---|
| `/explorer` | Homepage | ISR |
| `/explorer/collections` | Lista colecții | Dynamic (filtre) |
| `/explorer/collections/:collectionSlug` | Pagină colecție | ISR |
| `/explorer/collections/:collectionSlug/:itemSlug` | Pagină item (canonical) | ISR |
| `/explorer/search` | Căutare | Dynamic |
| `/explorer/search?q=...&type=...&year_min=...` | Căutare cu parametri | Dynamic |
| `/explorer/about` | Despre proiect | Static |

### Redirects

| De la | Către | Cod |
|---|---|---|
| `/explorer/items/:itemSlug` | `/explorer/collections/:cSlug/:iSlug` | 301 |
| Slug vechi (după redenumire) | Slug nou | 301 |

## I.3. API Endpoints

### Collections

| Method | Endpoint | Descriere | Query params |
|---|---|---|---|
| GET | `/explorer/api/collections` | Lista colecții (paginat) | `page`, `limit`, `sort`, `q`, `classification`, `institution`, `language`, `year_min`, `year_max`, `bbox` |
| GET | `/explorer/api/collections/:slug` | Detalii colecție | — |
| GET | `/explorer/api/collections/:slug/items` | Items din colecție (paginat) | `page`, `limit`, `sort`, `type`, `georef`, `year_min`, `year_max`, `q` |
| GET | `/explorer/api/collections/:slug/stats` | Statistici colecție | — |
| GET | `/explorer/api/collections/:slug/extent` | Extensie spațială GeoJSON | — |

### Items

| Method | Endpoint | Descriere | Query params |
|---|---|---|---|
| GET | `/explorer/api/items` | Lista items (paginat, filtrat) | `page`, `limit`, `sort`, `collection`, `type`, `georef`, `year_min`, `year_max`, `q`, `bbox`, `keywords`, `language`, `has_vector` |
| GET | `/explorer/api/items/:slug` | Detalii item complet (include resurse) | `include=resources,related` |
| GET | `/explorer/api/items/:slug/resources` | Resurse asociate itemului | `role`, `type` |
| GET | `/explorer/api/items/:slug/related` | Items înrudite | — |
| GET | `/explorer/api/items/:slug/thumbnail` | Redirect → thumbnail URL | — (302 redirect) |

### Search

| Method | Endpoint | Descriere |
|---|---|---|
| GET | `/explorer/api/search` | Căutare full-text + filtre combinate |
| GET | `/explorer/api/search/suggest` | Autocomplete (pg_trgm similarity) |
| GET | `/explorer/api/search/facets` | Facet counts pentru filtrele active |

**Exemplu request search complet:**

```
GET /explorer/api/search?q=braila&collection=atlas-militar-1916&type=map
    &georef=accurate&year_min=1800&year_max=1920
    &bbox=25.5,44.2,28.1,45.8&keywords=militar,topografie
    &language=ro&has_vector=true
    &sort=relevance&page=1&limit=20
```

**Exemplu response:**

```json
{
  "meta": {
    "query": "braila",
    "total": 47,
    "page": 1,
    "limit": 20,
    "pages": 3,
    "took_ms": 23
  },
  "facets": {
    "collection": [
      { "slug": "atlas-militar-1916", "title": "Atlas Militar 1916", "count": 12 },
      { "slug": "harta-topografica-1900", "title": "Harta Topografică 1:50000", "count": 8 }
    ],
    "item_type": [
      { "code": "map", "count": 35 },
      { "code": "plate", "count": 8 },
      { "code": "text_page", "count": 4 }
    ],
    "georef_status": [
      { "code": "accurate", "count": 20 },
      { "code": "precise", "count": 10 },
      { "code": "none", "count": 17 }
    ]
  },
  "items": [
    {
      "slug": "atlas-militar-1916/plansa-xii-braila",
      "title": "Planșa XII — Brăila",
      "collection": { "slug": "atlas-militar-1916", "title": "Atlas Militar 1916" },
      "item_type": "map",
      "year_start": 1916,
      "georef_status": "precise",
      "has_vector_derivative": true,
      "thumbnail_url": "/explorer/api/items/atlas-militar-1916/plansa-xii-braila/thumbnail",
      "bounding_box": { "type": "Polygon", "coordinates": [[[27.5,44.8],[28.2,44.8],[28.2,45.6],[27.5,45.6],[27.5,44.8]]] },
      "highlight": {
        "title": "Planșa XII — <em>Brăila</em>",
        "place_names": "<em>Brăila</em>;Galați;Dunărea"
      },
      "relevance_score": 0.92
    }
  ]
}
```

### Spatial

| Method | Endpoint | Descriere |
|---|---|---|
| GET | `/explorer/api/spatial/items?bbox=minx,miny,maxx,maxy` | Items cu footprint intersectînd bbox-ul dat |
| GET | `/explorer/api/spatial/collections?bbox=minx,miny,maxx,maxy` | Colecții cu extent intersectînd bbox-ul dat |

Response: GeoJSON FeatureCollection cu proprietăți minimale (slug, title, type, thumbnail_url) pentru rendering pe hartă.

### Geo Services (proxy / redirect)

| Method | Endpoint | Descriere |
|---|---|---|
| GET | `/explorer/api/tiles/:itemSlug/{z}/{x}/{y}.png` | Proxy → TiTiler (rezolvă cale COG din DB) |
| GET | `/explorer/api/vector/:datasetId` | Proxy → pg_featureserv |

### Admin (Faza 2+, autentificat)

| Method | Endpoint | Descriere |
|---|---|---|
| POST | `/explorer/api/admin/ingest` | Upload + procesare CSV (collections.csv, items.csv, resources.csv) |
| GET | `/explorer/api/admin/ingest/:id/status` | Status ingestie curentă |
| GET | `/explorer/api/admin/ingest/:id/report` | Raport detaliat ingestie |
| POST | `/explorer/api/admin/items/:slug/publish` | Publicare item |
| POST | `/explorer/api/admin/items/:slug/unpublish` | Retragere item |
| PATCH | `/explorer/api/admin/items/:slug` | Update metadate item |
| POST | `/explorer/api/admin/collections/:slug/publish` | Publicare colecție |
| POST | `/explorer/api/admin/reindex` | Trigger reindexare search |
| GET | `/explorer/api/admin/reports/errors` | Erori recente |
| GET | `/explorer/api/admin/reports/broken-links` | Linkuri invalide |
| GET | `/explorer/api/admin/stats` | Statistici sistem |

## I.4. Response format standard

Toate endpoint-urile API returnează JSON cu structură consistentă:

```json
// Success (single resource)
{
  "data": { ... },
  "meta": { "generated_at": "2026-04-04T18:00:00Z" }
}

// Success (collection/list)
{
  "data": [ ... ],
  "meta": {
    "total": 234,
    "page": 1,
    "limit": 20,
    "pages": 12
  }
}

// Error
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item with slug 'xyz' not found",
    "status": 404
  }
}
```

## I.5. SEO și Discoverability

### JSON-LD (în `<head>` pe fiecare pagină item)

```json
{
  "@context": "https://schema.org",
  "@type": "Map",
  "identifier": "atlas-militar-1916/plansa-xii-braila",
  "name": "Planșa XII — Brăila și Galați",
  "description": "Planșă topografică militară scara 1:200000",
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

### Open Graph tags

```html
<meta property="og:title" content="Planșa XII — Brăila și Galați" />
<meta property="og:description" content="Planșă topografică militară, Atlas Militar 1916" />
<meta property="og:image" content="https://services.geo-spatial.org/explorer/api/items/atlas-militar-1916/plansa-xii-braila/thumbnail" />
<meta property="og:url" content="https://services.geo-spatial.org/explorer/collections/atlas-militar-1916/plansa-xii-braila" />
<meta property="og:type" content="website" />
```

### Sitemap

- Generat automat din Next.js `sitemap.ts`
- Include toate colecțiile și items publicate
- `lastmod` din `updated_at`
- Prioritate: homepage 1.0, colecții 0.8, items 0.6

### robots.txt

```
User-agent: *
Allow: /explorer/
Disallow: /explorer/api/admin/
Disallow: /explorer/api/tiles/
Sitemap: https://services.geo-spatial.org/explorer/sitemap.xml
```
