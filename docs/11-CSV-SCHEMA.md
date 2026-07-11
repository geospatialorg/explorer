# CSV — Schema de Import

> **Principiu:** Echipa de administrare furnizează toate datele prin CSV-uri. Aplicația nu pregătește date.
> CSV-urile conțin endpoint-uri și locații pe disk unde se găsesc resursele.

## Strategia de fișiere: recomandat 3 fișiere

**Recomandat:** Trei fișiere CSV separate, nu un singur fișier monolitic.

| Fișier | Conține | Motivare |
|---|---|---|
| `collections.csv` | Definiție colecții (UUID, titlu, descriere, tag-uri, thumbnail) | O colecție per rînd. Simplu, clar, rar modificat |
| `items.csv` | Metadate items + referință la colecție | Un item per rînd. Fișierul principal, cel mai frecvent actualizat |
| `resources.csv` | Resurse asociate items (endpoint-uri, locații disk) | O resursă per rînd. Permite N resurse per item fără coloane multiplicate |

**Alternativă (MVP simplificat):** Un singur `items.csv` cu coloane prefixate pentru resurse comune (scan_url, georef_url, cog_url, wms_url). Funcționează dacă fiecare item are cel mult 4-5 resurse de tipuri fixe.

**Recomandare:** Începe cu varianta simplificată (un singur CSV) în MVP, migrează la 3 fișiere cînd apar nevoi de resurse multiple/variate.

---

## Schema CSV minimă (MVP — un singur fișier)

### `items.csv` — Schema minimă

```csv
collection_slug,title,item_type,georef_status,scan_url
atlas-militar-1916,Planșa I — București,map,accurate,/data/scans/atlas-militar-1916/plansa-i.tif
atlas-militar-1916,Planșa II — Brăila,map,precise,/data/scans/atlas-militar-1916/plansa-ii.tif
atlas-militar-1916,Legenda generală,legend,none,/data/scans/atlas-militar-1916/legenda.jpg
harta-topo-1900,Foaia L-35-52,map,none,/data/scans/harta-topo-1900/l-35-52.tif
```

> **Notă:** `scan_url` poate fi o cale pe disk (`/data/scans/...`) sau un URL (`https://...`). Aplicația tratează ambele.

**Cîmpuri obligatorii schema minimă:**

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `collection_slug` | text | **Da** | Slug-ul colecției părinte. Dacă nu există, se creează automat cu acest slug |
| `title` | text | **Da** | Titlul itemului |
| `item_type` | enum | **Da** | Tip: `map`, `plate`, `atlas_page`, `chart`, `text_page`, `table`, `legend`, `technical`, `composite`, `other` |
| `georef_status` | enum | Nu (default `none`) | `none`, `approximate`, `accurate`, `precise` |
| `scan_url` | URL/path | Nu | URL sau cale pe disk fișier scanat |

Cu doar aceste 5 coloane, aplicația poate importa un inventar minimal funcțional.

---

## Schema CSV recomandată / extinsă (un singur fișier)

### `items.csv` — Schema extinsă

```csv
collection_slug,collection_title,slug,title,subtitle,item_type,authors,cartographers,editors,engravers,institution,year_start,year_end,date_description,language,scale,projection_crs,bbox_west,bbox_south,bbox_east,bbox_north,place_names,administrative_units,subject,description,georef_status,georef_quality,georef_method,source_format,image_width_px,image_height_px,dpi,license,copyright,source_description,provenance,editorial_notes,has_vector_derivative,keywords,scan_url,georef_url,cog_url,wms_url,wms_layer,wmts_url,vector_geojson_url,vector_gpkg_url,vector_fgb_url,thumbnail_url,related_items,_action
atlas-militar-1916,Atlas Militar 1916,plansa-xii-braila,Planșa XII — Brăila și Galați,,map,,"Col. Ionescu, Lt. Popescu",,Gravura SMR,Marele Stat Major,1916,1916,,ro,1:200000,Bonne,27.5,44.8,28.2,45.6,"Brăila;Galați;Dunărea","Brăila;Galați",Topografie militară,Planșă topografică militară acoperind zona Brăila-Galați,precise,RMSE < 50m,manual_gcp,TIFF,8000,6000,400,CC-BY-4.0,Domeniu public,Exemplar ANR cota 234/1916,Scanat 2015 la 400 DPI de ANR,Verificat și validat 2024,true,"militar;topografie;Brăila;Dunăre",/data/scans/atlas-militar-1916/pl-xii.tif,/data/georef/atlas-militar-1916/pl-xii-georef.tif,/data/cog/atlas-militar-1916/pl-xii.tif,https://services.geo-spatial.org/geoserver/wms,atlas_militar:plansa_xii,,/data/vectors/atlas-militar-1916/pl-xii.geojson,/data/vectors/atlas-militar-1916/pl-xii.gpkg,/data/vectors/atlas-militar-1916/pl-xii.fgb,/data/thumbnails/atlas-militar-1916/pl-xii-thumb.webp,plansa-xi-constanta;plansa-xiii-tulcea,
```

> **Notă:** Valorile `scan_url`, `georef_url`, `cog_url`, `thumbnail_url` etc. pot fi căi pe disk (`/data/...`) sau URL-uri (`https://...`).

### Descriere coloane complete

#### Identificare și relație

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `collection_slug` | text | **Da** | Slug colecție. Dacă nu există → se creează |
| `collection_title` | text | Nu | Titlu colecție. Folosit la creare automată. Ignorat dacă colecția există |
| `slug` | text | Nu | Slug item. Dacă gol → generat din `title` |
| `_action` | text | Nu | `delete` → soft-delete item. Gol → insert/update |

#### Metadate descriptive

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `title` | text | **Da** | Titlu item |
| `subtitle` | text | Nu | Subtitlu |
| `item_type` | enum | **Da** | Tip item |
| `authors` | text | Nu | Autori, separați prin `;` |
| `cartographers` | text | Nu | Cartografi, separați prin `;` |
| `editors` | text | Nu | Editori, separați prin `;` |
| `engravers` | text | Nu | Gravori, separați prin `;` |
| `institution` | text | Nu | Instituție |
| `description` | text | Nu | Descriere liberă |
| `subject` | text | Nu | Temă / subiect |
| `keywords` | text | Nu | Cuvinte cheie, separate prin `;` |
| `language` | text | Nu | Cod limbă ISO 639-1 (`ro`, `de`, `fr`, `hu`) |

#### Temporal

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `year_start` | int | Nu | An început |
| `year_end` | int | Nu | An sfîrșit (= year_start dacă exact) |
| `date_description` | text | Nu | Text liber: „circa 1870", „ante 1900" |

#### Spațial

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `bbox_west` | float | Nu | Longitudine vest (WGS84) |
| `bbox_south` | float | Nu | Latitudine sud (WGS84) |
| `bbox_east` | float | Nu | Longitudine est (WGS84) |
| `bbox_north` | float | Nu | Latitudine nord (WGS84) |
| `place_names` | text | Nu | Toponime, separate prin `;` |
| `administrative_units` | text | Nu | Unități administrative, separate prin `;` |
| `scale` | text | Nu | Scara: „1:50000", „variabilă" |
| `projection_crs` | text | Nu | Proiecție/CRS: „EPSG:3844", „Bonne" |

#### Georeferențiere

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `georef_status` | enum | Nu (default `none`) | `none`, `approximate`, `accurate`, `precise` |
| `georef_quality` | text | Nu | Descriere calitate: „RMSE < 50m" |
| `georef_method` | text | Nu | Metodă: `manual_gcp`, `automatic`, `derived` |

#### Tehnic

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `source_format` | text | Nu | Format sursă: TIFF, JPEG, PNG |
| `image_width_px` | int | Nu | Lățime imagine px |
| `image_height_px` | int | Nu | Înălțime imagine px |
| `dpi` | int | Nu | Rezoluție DPI |

#### Drepturi

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `license` | text | Nu | Licență: CC-BY-4.0, CC0, etc. |
| `copyright` | text | Nu | Deținător copyright |

#### Proveniență

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `source_description` | text | Nu | Sursă directă |
| `provenance` | text | Nu | Lineage complet |
| `editorial_notes` | text | Nu | Note editoriale |

#### Resurse (URL-uri sau căi pe disk)

> **Notă:** Toate cîmpurile de resurse acceptă atît URL-uri (`https://...`) cît și căi pe disk (`/data/...`). Aplicația nu pregătește date — toate fișierele trebuie să fie deja pregătite de echipa admin.

| Coloană | Tip | Descriere | Resource type generat |
|---|---|---|---|
| `scan_url` | URL/path | Fișier scanat | `scan` + role `download` |
| `georef_url` | URL/path | Raster georeferșiat | `georeferenced_raster` + role `download` |
| `cog_url` | URL/path | Cloud Optimized GeoTIFF (pregătit extern) | `cog` + role `view` |
| `wms_url` | URL | Endpoint WMS (inclusiv GeoServer EPSG:404000 pt scanări) | `wms` + role `service` sau `view` |
| `wms_layer` | text | Nume layer WMS | Stocat în `resource.layer_name` |
| `wmts_url` | URL | Endpoint WMTS | `wmts` + role `service` |
| `vector_geojson_url` | URL/path | GeoJSON vectorial | `geojson` + role `view` |
| `vector_gpkg_url` | URL/path | GeoPackage vectorial | `geopackage` + role `download` |
| `vector_fgb_url` | URL/path | FlatGeobuf vectorial | `flatgeobuf` + role `view` + `download` |
| `thumbnail_url` | URL/path | Thumbnail (furnizat de admin, nu generat) | `thumbnail` + role `thumbnail` |

#### Relații și flags

| Coloană | Tip | Descriere |
|---|---|---|
| `has_vector_derivative` | bool | `true`/`false` — are versiune vectorială |
| `related_items` | text | Slug-uri items înrudite, separate prin `;` |

---

## Schema cu 3 fișiere (recomandat producție)

### `collections.csv`

> **Colecțiile se creează prin CSV.** Fiecare colecție trebuie să aibă: UUID, titlu, descriere, tag-uri, thumbnail.

```csv
uuid,slug,title,description,tags,thumbnail,authors,institution,language,license,classification,year_start,year_end,bbox_west,bbox_south,bbox_east,bbox_north,external_links
a1b2c3d4-e5f6-7890-abcd-ef1234567890,atlas-militar-1916,Atlas Militar 1916,Atlas topografic militar al României realizat de Marele Stat Major,"militar;topografie;Romania;WW1",/data/thumbnails/atlas-militar-1916/cover.webp,Marele Stat Major,Arhivele Naționale ale României,ro,CC-BY-4.0,atlas,1914,1918,20.2,43.6,30.0,48.3,"Catalog ANR=https://catalog.anr.ro/123"
```

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `uuid` | UUID | **Da** | Identificator unic colecție (furnizat de admin) |
| `slug` | text | **Da** | Slug unic colecție (URL-friendly) |
| `title` | text | **Da** | Titlu colecție |
| `description` | text | **Da** | Descriere colecție |
| `tags` | text | **Da** | Tag-uri / cuvinte cheie, separate prin `;` |
| `thumbnail` | URL/path | **Da** | Thumbnail colecție (URL sau cale pe disk, furnizat de admin) |
| `authors` | text | Nu | Autori/editori |
| `institution` | text | Nu | Instituție sursă |
| `language` | text | Nu | Limbă |
| `license` | text | Nu | Licență |
| `classification` | text | Nu | Tip: atlas, serie, fond |
| `year_start` | int | Nu | An început |
| `year_end` | int | Nu | An sfîrșit |
| `bbox_west/south/east/north` | float | Nu | Bounding box WGS84 |
| `external_links` | text | Nu | Format: `label=url;label2=url2` |

### `items.csv`

Identic cu schema extinsă de mai sus, minus coloanele de resurse.

### `resources.csv`

```csv
item_slug,resource_type,format,url,role,protocol,mime_type,file_size_bytes,layer_name,description,is_primary
plansa-xii-braila,scan,TIFF,/data/scans/atlas-militar-1916/pl-xii.tif,download,HTTP,image/tiff,180000000,,,true
plansa-xii-braila,cog,COG,/data/cog/atlas-militar-1916/pl-xii.tif,view,HTTP,image/tiff,95000000,,,false
plansa-xii-braila,wms,,https://services.geo-spatial.org/geoserver/wms,view,OGC:WMS,,,,atlas_militar:plansa_xii,WMS layer pentru Planșa XII (EPSG:404000),false
plansa-xii-braila,thumbnail,WebP,/data/thumbnails/atlas-militar-1916/pl-xii-thumb.webp,thumbnail,HTTP,image/webp,45000,,,false
plansa-xii-braila,geojson,GeoJSON,/data/vectors/atlas-militar-1916/pl-xii.geojson,view,HTTP,application/geo+json,2500000,,,false
plansa-xii-braila,geopackage,GPKG,/data/vectors/atlas-militar-1916/pl-xii.gpkg,download,HTTP,application/geopackage+sqlite3,5000000,,Date vectoriale derivate,false
```

> **Notă:** `url` poate fi o cale pe disk (`/data/...`) sau un URL (`https://...`). Aplicația tratează ambele.

| Coloană | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `item_slug` | text | **Da** | Slug-ul itemului asociat |
| `resource_type` | enum | **Da** | `scan`, `georeferenced_raster`, `cog`, `thumbnail`, `vector`, `wms`, `wmts`, `wfs`, `kml`, `geopackage`, `flatgeobuf`, `geojson`, `geoparquet`, `other` |
| `format` | text | Nu | Format specific: TIFF, COG, GPKG, GeoJSON etc. |
| `url` | URL/path | **Da** | URL-ul sau calea pe disk a resursei |
| `role` | enum | **Da** | `download`, `view`, `service`, `thumbnail`, `preview`, `metadata` |
| `protocol` | text | Nu | `HTTP`, `OGC:WMS`, `OGC:WMTS`, `OGC:WFS`, `OGC:API-Features` |
| `mime_type` | text | Nu | MIME type |
| `file_size_bytes` | int | Nu | Dimensiune fișier |
| `layer_name` | text | Nu | Nume layer (WMS/WMTS) |
| `description` | text | Nu | Descriere resursă |
| `is_primary` | bool | Nu | Resursa principală de vizualizare |

---

## Reguli de procesare

### Cum se reprezintă relația collection-item

- **Schema unificată:** coloana `collection_slug` în `items.csv` face legătura
- **Schema cu 3 fișiere:** `items.csv` referențiază `collections.csv` prin `collection_slug`
- Dacă `collection_slug` nu există în DB/collections.csv → se creează automat o colecție cu slug-ul respectiv și `collection_title` (dacă e furnizat) sau slug-ul ca titlu

### Cum se reprezintă resurse multiple

- **Schema unificată:** coloane fixe (`scan_url`, `georef_url`, `cog_url`, `wms_url` etc.) — max ~10 tipuri predefinite
- **Schema cu 3 fișiere:** `resources.csv` cu N rînduri per item — nelimitat, flexibil
- **Recomandare:** Schema unificată pentru MVP (simplu), 3 fișiere pentru producție

### Cum se marchează georeferențierea

- Coloana `georef_status`:
  - `none` → item NU e georeferențiat (sau gol → default `none`)
  - `approximate` → georef orientativă
  - `accurate` → georef bună
  - `precise` → georef de precizie
- Prezența `cog_url` sau `georef_url` non-empty confirmă implicit
- Dacă `wms_url` pointează la GeoServer cu EPSG:404000 și `georef_status = none` → scanare non-georef vizualizabilă prin WMS

### Cum se marchează versiunea vectorială

- Coloana `has_vector_derivative`: `true` / `false`
- Prezența `vector_geojson_url` sau `vector_gpkg_url` sau `vector_fgb_url` non-empty confirmă implicit
- La import: dacă oricare URL vector e non-empty → `has_vector_derivative = true` automat

### Cum se gestionează valori lipsă

| Situație | Tratament |
|---|---|
| Cîmp opțional gol | Stocat ca `NULL` în DB |
| `year_end` gol dar `year_start` prezent | `year_end = year_start` (an exact) |
| `slug` gol | Generat automat din `title` |
| `georef_status` gol | Default `none` |
| `has_vector_derivative` gol | Default `false` |
| `bbox_*` parțial completat | Se ignoră tot bbox-ul (warning) |
| `keywords` gol | Fără keywords (tabel `item_keywords` gol) |
| `collection_title` gol | Se folosește `collection_slug` ca titlu |

### Encoding și format CSV

- **Encoding:** UTF-8 (cu sau fără BOM)
- **Separator:** virgulă (`,`)
- **Quoting:** Ghilimele duble (`"`) pentru valori care conțin virgule, ghilimele sau newline
- **Newline:** `\n` sau `\r\n`
- **Header:** Prima linie e obligatoriu header cu numele coloanelor
- **Coloane extra:** Ignorate cu warning (forward-compatible)
- **Coloane lipsă obligatorii:** Error → fișier respins
