# H. Riscuri și Decizii Arhitecturale (ADR)

## ADR-001: Cum tratăm conținutul mixt

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Colecțiile geo-spatial.org conțin hărți georeferențiate, scanări simple, grafice, tabele, pagini text — toate trebuie tratate coerent fără a forța context geospațial pe conținut non-geospațial. |
| **Decizie** | Fiecare item are un `item_type` care, combinat cu `georef_status`, determină automat viewer-ul afișat. Nu există un viewer universal. |
| **Opțiuni considerate** | (a) Viewer unic cu moduri — **respinsă**, forțează compromisuri UX; (b) Viewer per tip — **acceptată**; (c) Fără viewer pentru non-geo — **respinsă**, experiență incompletă |
| **Reguli selecție** | Vezi tabelul de mai jos |
| **Consecințe** | Componenta `ViewerSwitcher` alege automat. Cod de routing pentru 3 categorii de vizualizare. |

### Matrice selecție viewer

| Condiție | Viewer principal | Taburi suplimentare |
|---|---|---|
| `georef_status != 'none'` AND are resursă COG | **GeoViewer** (OpenLayers + TiTiler) | + Scan WMS (dacă există), + Vector (dacă `has_vector_derivative`) |
| `georef_status != 'none'` AND are resursă WMS extern | **GeoViewer** (OpenLayers + WMS) | + Vector (dacă `has_vector_derivative`) |
| `georef_status = 'none'` AND are resursă WMS GeoServer (EPSG:404000) | **ScanWmsViewer** (OpenLayers + WMS GeoServer) | Vizualizare scanare prin WMS |
| `georef_status = 'none'` AND NU are WMS | **Imagine statică** (thumbnail furnizat prin CSV) | Fără viewer interactiv |
| `has_vector_derivative = true` | — | Tab **VectorViewer** (MapLibre) adăugat |

---

## ADR-002: Separarea viewer-urilor

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | OpenLayers și MapLibre au paradigme diferite (proiecții geospațiale/WMS vs. WebGL vector). |
| **Decizie** | Două viewer-e principale (OpenLayers pentru georef+scan, MapLibre pentru vector), unite prin componenta `<ViewerSwitcher>` cu tabs. |
| **Motivare** | OpenLayers acoperă atît tile-uri TiTiler (georef) cît și WMS GeoServer (scanări non-georef cu EPSG:404000). MapLibre e optimizat pentru WebGL vector rendering. |
| **Implementare** | `<ViewerSwitcher item={item} resources={resources} />` face routing-ul. Lazy loading per viewer (doar viewer-ul activ se încarcă). |

---

## ADR-003: Vizualizare scanări non-georeferențiate

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Scanările de hărți fără georeferențiere necesită un mecanism de vizualizare. |
| **Decizie** | **WMS de la GeoServer (`https://services.geo-spatial.org/geoserver`) cu EPSG:404000.** |
| **Motivare** | GeoServer-ul este deja existent și configurat. EPSG:404000 folosește coordonate în pixeli (image coordinates), potrivit pentru scanări fără coordonate reale. OpenLayers consumă WMS nativ — un singur viewer acoperă atît georef cît și non-georef. |
| **Trade-off** | Dependență de serviciul GeoServer extern. Dacă GeoServer-ul nu e disponibil, se afișează thumbnail-ul static. |
| **Alternativă respinsă** | OpenSeadragon / IIIF / DZI — adaugă complexitate (server de imagini dedicat) fără beneficiu real, dat fiind că GeoServer-ul deja există. |

---

## ADR-004: COG pentru rasterele georeferențiate

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Rasterele georeferențiate trebuie servite ca tile-uri web. Opțiunile: pre-generate tile cache, GeoServer, TiTiler cu COG. |
| **Decizie** | **COG este formatul principal de servire. TiTiler servește tile-uri on-the-fly de pe disk.** |
| **Motivare** | COG permite HTTP range requests → TiTiler citește doar tile-urile necesare. Stocare pe disk (volume mount Docker). Fără pre-generare. |
| **Consecințe** | Echipa de administrare trebuie să furnizeze COG-uri pregătite extern. Aplicația nu face conversie GeoTIFF → COG. Fișierele non-COG rămîn ca download dar nu se servesc ca tile-uri. |
| **Performanță** | COG-uri cu overview-uri LANCZOS și BLOCKSIZE=512 performează bine pînă la ~2GB per fișier. Peste aceasta, recomandat tile cache CDN. |

---

## ADR-005: Resurse — locații disk, endpoint-uri externe, CSV

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Datele sînt stocate pe disk sau servite de servicii externe (WMS). Aplicația nu administrează storage. |
| **Decizie** | **Toate locațiile (disk paths, URL-uri externe) sînt furnizate prin CSV-uri de echipa de administrare.** |
| **Model** | Cale pe disk: `/data/cog/collection/item.tif` → TiTiler citește via volume mount. URL extern: `https://services.geo-spatial.org/geoserver/wms?...` → folosit as-is. |
| **Consecințe** | Link monitoring în admin (Faza 3): verificare periodică disponibilitate URL-uri externe. UI fallback cînd un link extern e indisponibil. |
| **Reguli** | Thumbnails: furnizate de admin (URL sau disk path în CSV). COG-uri: pe disk, cale din CSV. WMS/WMTS externe: listate, nu proxy-ate. |

---

## ADR-006: TiTiler + GeoServer (extern) — strategie combinată

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Necesități: (a) servire tile-uri raster georef, (b) vizualizare scanări non-georef, (c) servire features vectoriale. |
| **Decizie** | **TiTiler pentru raster georef (COG) + GeoServer extern pentru scanări non-georef (WMS EPSG:404000) + pg_featureserv/Martin pentru vector.** |

| Componentă | Tehnologie | Administrat de |
|---|---|---|
| Raster georef tiles | TiTiler (Docker) | Aplicație |
| Scanări non-georef WMS | GeoServer (`services.geo-spatial.org`) | Extern |
| Vector features | pg_featureserv (Docker) | Aplicație |
| Vector tiles | Martin (Docker, Faza 2) | Aplicație |

| **Avantaj** | GeoServer-ul deja există și e configurat. Nu adăugăm overhead de administrare. TiTiler rămîne lightweight pentru COG-uri. |

---

## ADR-007: Generare statică + API vs. aplicație complet dinamică

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Conținutul colecțiilor se schimbă rar (zile/săptămîni). Search și filtre necesită queries dinamice. |
| **Decizie** | **Hibrid: ISR (Incremental Static Regeneration) pentru pagini de conținut, API dinamic pentru search/filtre.** |
| **Pagini statice (ISR)** | `/explorer/collections/[slug]`, `/explorer/collections/[cslug]/[islug]` — pre-generate la build, revalidate on-demand la update via admin/ingestie |
| **Pagini dinamice** | `/explorer/search`, `/explorer/api/*` — query-uri la fiecare request |
| **Implementare** | Next.js `generateStaticParams()` pentru colecții + items. `revalidatePath()` / `revalidateTag()` la actualizare. |
| **Beneficii** | Încărcare instant pagini item (HTML pre-generat), SEO excelent (crawlere primesc HTML complet), load minim pe DB pentru browsing. |
| **Trade-off** | Build inițial mai lent dacă sînt mii de items. Mitigare: ISR on-demand (pagini generate la primul request). |

---

## ADR-008: Strategie de slug-uri și permalink-uri

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Conținutul patrimonial necesită URL-uri stabile pe termen lung (ani/decenii). |
| **Decizie** | Slug-uri human-readable, UUID intern, redirects la schimbare. |
| **Format slug** | `{collection_slug}/{item_slug}` — ex: `atlas-militar-1916/plansa-xii-braila` |
| **URL complet** | `/explorer/collections/atlas-militar-1916/plansa-xii-braila` |
| **Generare** | Transliterare diacritice (ă→a, ș→s, î→i, ț→t, â→a) + lowercase + replace non-alnum cu `-` + dedup `--` |
| **Stabilitate** | UUID-ul intern NU se schimbă niciodată. Slug-ul se schimbă doar explicit. La schimbare → redirect 301 din slug-ul vechi. |
| **Sursă slug** | Furnizat explicit în CSV (cîmpul `slug`) sau generat automat din `title`. |

---

## ADR-009: Limba interfeței

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Metadatele sînt frecvent în limba originală (RO, DE, FR, HU). Interfața poate fi RO-only sau multilingvă. |
| **Decizie** | **RO + EN din Faza 1** (i18n via `next-intl`). Metadatele rămîn în limba originală a documentului. |
| **Implementare** | `next-intl` pentru texte interfață. Cîmpul `language` indică limba conținutului, nu a interfeței. |

---

## ADR-010: Aplicația nu pregătește date

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Conversia GeoTIFF → COG, generarea thumbnails, procesarea rasterelor — toate necesită GDAL și un pipeline complex. |
| **Decizie** | **Aplicația nu se ocupă de pregătirea datelor.** Echipa de administrare furnizează prin CSV-uri endpoint-urile și locațiile pe disk ale resurselor deja pregătite (COG-uri, thumbnails, scanări). |
| **Motivare** | Simplifică dramatic aplicația. Reduce dependențele (fără GDAL, fără sharp, fără MinIO). Echipa admin controlează complet calitatea datelor. |
| **Consecințe** | Documentație clară pentru echipa admin despre formatele așteptate (COG cu overview-uri, thumbnails JPEG/WebP, etc.). |

---

## ADR-011: Base path `/explorer`

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Aplicația trebuie să ruleze la `/explorer` indiferent de domeniu (localhost, services.geo-spatial.org, etc.). |
| **Decizie** | **Next.js `basePath: '/explorer'` în `next.config.ts`.** |
| **Implementare** | `NEXT_PUBLIC_BASE_PATH=/explorer` în `.env`. Toate rutele, API-urile și asset-urile sînt sub `/explorer`. |
| **Consecințe** | Caddy/nginx reverse proxy rutează `/explorer/*` către Next.js. Alte aplicații pot coexista pe același domeniu. |

---

## ADR-012: Administrare prin CSV-uri

| | |
|---|---|
| **Status** | Acceptat |
| **Context** | Echipa de administrare trebuie să poată crea colecții și furniza date fără interfață complexă. |
| **Decizie** | **Trei fișiere CSV:** `collections.csv` (UUID, titlu, descriere, tag-uri, thumbnail), `items.csv` (metadate items), `resources.csv` (endpoint-uri, locații disk). |
| **Motivare** | CSV e familiar pentru echipa admin. Ușor de editat în Excel/LibreOffice. Versionabil cu Git. |
| **Consecințe** | Script de ingestie CLI + endpoint admin API pentru upload CSV. Validare Zod la import. Raport detaliat erori. |
