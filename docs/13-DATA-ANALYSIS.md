# Analiza datelor existente — atlas-agricol-1938

> **Notă:** Aplicația nu pregătește date. Acțiunile de conversie COG, generare thumbnails și verificare proiecție sînt responsabilitatea echipei de administrare.

## 1. CSV existent — structura coloanelor

Fișier: `colectii/atlas-agricol-1938/planse-atlas-agricol-1938.csv`

| Coloana sursă | Tip / Valori | Mapare → câmp canonical |
|---|---|---|
| `id` | int 1-104 | — (ignorat, se folosește uuid) |
| `id_leading` | text `001`-`104` | `extra_metadata.order` |
| `uuid` | UUID v4 | `id` — **se folosește as-is, deja stabil** |
| `fișier` | `atlas_agricol_1938_NNN` | `slug` (underscore→hyphen) |
| `dimensiune_x` | int (5005–5144) | `image_width_px` |
| `dimensiune_y` | int (3633–3660) | `image_height_px` |
| `tip` | enum (vezi §2) | `item_type` (mapare) |
| `spatializare` | `0` sau `1` | `georef_status` (`0`→`none`, `1`→`accurate`) |
| `nume_original` | titlu FR majuscule | — (ignorat, `nume_sentence_case` e mai bun) |
| `nume_sentence_case` | titlu FR sentence case | `subtitle` |
| `Comment` | note atribuire | `editorial_notes` |
| `nume_limba_romana` | traducere RO | `title` (**titlul principal**) |

## 2. Mapare tipuri (`tip` → `item_type`)

| Valoare CSV | Count | → `item_type` |
|---|---|---|
| `harta` | 53 | `map` |
| `tabel` | 36 | `table` |
| `grafic` | 6 | `chart` |
| `desc` | 7 | `text_page` |
| `copertă` | 2 | `atlas_page` |
| **Total** | **104** | |

## 3. Starea fișierelor

### Fișiere georeferențiate (`data/georef/`)
- **43 fișiere GeoTIFF** prezente → corespund exact cu `spatializare=1`
- Dimensiune: 40–51 MB per fișier → **~1.9 GB total**
- Stare: GeoTIFF clasic — **necesită conversie COG de către echipa admin** înainte de a servi tile-uri prin TiTiler

### Fișiere scanate (`data/scan/`)
- **Director gol** — 0 fișiere
- 61 items cu `spatializare=0` + 43 items cu georef = 104 total — **toate scanările lipsesc**
- Probabil sunt stocate altundeva sau nu au fost copiate încă
- Scanările non-georef se vor vizualiza prin WMS GeoServer (`services.geo-spatial.org`) cu EPSG:404000

## 4. Decizii de mapare confirmate

### Titlu: strategie bilingvă

Atlasul este publicat în franceză (1938). Interfața aplicației este RO+EN.

| Câmp | Sursă | Exemplu |
|---|---|---|
| `title` | `nume_limba_romana` | „Terenuri arabile. Repartiția suprafețelor pe județe" |
| `subtitle` | `nume_sentence_case` | „Terres labourables. Superficie répartition par départements." |
| `language` | hardcoded `fr` | Atlas publicat în franceză |

→ Titlul RO ca `title` principal = cel mai bun pentru SEO + căutare în interfața RO+EN.

### Slug-uri

| Valoare `fișier` | Slug colecție | Slug item |
|---|---|---|
| `atlas_agricol_1938_008` | `atlas-agricol-1938` | `atlas-agricol-1938-008` |
| `atlas_agricol_1938_042` | `atlas-agricol-1938` | `atlas-agricol-1938-042` |

URL public: `/explorer/collections/atlas-agricol-1938/atlas-agricol-1938-008`

### Georef status

`spatializare=1` → `georef_status = 'accurate'`

Motivare: fișierele sînt GeoTIFF-uri produse profesional, nu georeferențieri aproximative.
De actualizat manual la `precise` după validare detaliată.

## 5. Metadate colecție (deduse din conținut)

| Câmp | Valoare |
|---|---|
| `slug` | `atlas-agricol-1938` |
| `title` | `Atlasul Agricol al României 1938` |
| `subtitle` | `Atlas Agricole de la Roumanie 1938` |
| `authors` | `Ministerul Agriculturii și Domeniilor` |
| `institution` | `Ministerul Agriculturii și Domeniilor al României` |
| `language` | `fr` |
| `year_start` | `1938` |
| `year_end` | `1938` |
| `license` | `Public Domain` |
| `classification` | `atlas` |
| `bbox` | 20.2, 43.6, 30.0, 48.3 (România) |
| `keywords` | `agricultură;România;interbelică;1938;hărți tematice` |

## 6. Resurse care lipsesc / acțiuni necesare (responsabilitatea echipei admin)

> **Toate acțiunile de mai jos sînt responsabilitatea echipei de administrare, nu a aplicației.**

| Acțiune | Prioritate | Note |
|---|---|---|
| Copiere fișiere scan pe disk | **Ridicată** | 104 fișiere TIFF/JPEG așteptate; locațiile se furnizează prin CSV |
| Conversie GeoTIFF → COG (43 fișiere) | **Ridicată** | Necesar pentru TiTiler; **se face extern, nu de aplicație** |
| Verificare proiecție GeoTIFF-uri | **Ridicată** | Confirmare EPSG (probabil EPSG:4326 sau EPSG:3844) |
| Pregătire thumbnails | **Ridicată** | Thumbnails furnizate prin CSV (nu generate de aplicație) |
| Publicare layere WMS pe GeoServer | **Ridicată** | Layere WMS pe `services.geo-spatial.org` cu EPSG:404000 pentru scanările non-georef |
| Extragere bbox per item (din GeoTIFF) | Medie | Se extrage cu `gdalinfo` extern, se furnizează în CSV |
| Confirmare WMS/WMTS existente pe geo-spatial.org | Medie | Ce layere există deja pentru acest atlas? |

## 7. Verificare rapidă GeoTIFF (de rulat manual de echipa admin)

```bash
# Verificare proiecție și bounds pentru primul fișier georef
gdalinfo colectii/atlas-agricol-1938/data/georef/atlas_agricol_1938_008.tif | grep -E "EPSG|Bounding|Pixel Size"

# Verificare dacă e deja COG
python3 -c "from osgeo import gdal; ds=gdal.Open('colectii/atlas-agricol-1938/data/georef/atlas_agricol_1938_008.tif'); print(ds.GetDriver().ShortName)"

# Conversie GeoTIFF → COG (responsabilitatea echipei admin)
gdal_translate input.tif output_cog.tif \
  -of COG \
  -co COMPRESS=DEFLATE \
  -co QUALITY=85 \
  -co OVERVIEW_RESAMPLING=LANCZOS \
  -co BLOCKSIZE=512
```

## 8. Probleme cunoscute CSV

- Rîndurile 86-87 în CSV conțin un newline în cîmpul `nome_limba_romana` al rîndului 86 (`atlas_agricol_1938_085`, `atlas_agricol_1938_086`) — CSV parser standard gestionează corect dacă respectă RFC 4180 cu quoting
- `id=5` are `nome_limba_romana = Curpins` (typo pentru „Cuprins") — de corectat manual
- Cîmpul `Comment` este gol pentru majoritatea items, cu excepția cîtorva hărți cu note de atribuire

## 9. Omogenizare între colecții

Colecțiile viitoare vor diferi față de acest atlas. Schema CSV canonică (din `docs/11-CSV-SCHEMA.md`) permite:
- Coloane diferite per colecție (scriptul de normalizare se adaptează per sursă)
- Valori lipsă → NULL în DB
- Fiecare colecție poate adăuga câmpuri în `extra_metadata`

**Recomandare:** câte un script de normalizare per colecție (ex: `scripts/normalize_atlas_agricol_1938.py`, `scripts/normalize_harta_topo_50000.py`) + un validator comun care verifică output-ul canonical.
