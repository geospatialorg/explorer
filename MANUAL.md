# Manual de Utilizare — geo-spatial.org Explorer

**URL public:** `https://services.geo-spatial.org/explorer`  
**Versiune aplicație:** 0.1.0  
**Stack:** Next.js 14 · PostgreSQL + PostGIS · Drizzle ORM · PM2 · TiTiler · GeoServer · OpenLayers · Nginx

---

## Cuprins

1. [Arhitectura sistemului](#1-arhitectura-sistemului)
2. [Variabile de mediu (.env)](#2-variabile-de-mediu-env)
3. [Componenta: Aplicația Next.js](#3-componenta-aplicația-nextjs)
4. [Componenta: Baza de date PostgreSQL](#4-componenta-baza-de-date-postgresql)
5. [Componenta: PM2 (Process Manager)](#5-componenta-pm2-process-manager)
6. [Componenta: TiTiler (vizualizare COG)](#6-componenta-titiler-vizualizare-cog)
7. [Componenta: GeoServer (scanări WMS)](#7-componenta-geoserver-scanări-wms)
8. [Componenta: Nginx (reverse proxy)](#8-componenta-nginx-reverse-proxy)
9. [Procedura de deploy complet](#9-procedura-de-deploy-complet)
10. [Import date CSV](#10-import-date-csv)
11. [Panoul de administrare](#11-panoul-de-administrare)
12. [Schema CSV pentru items](#12-schema-csv-pentru-items)
13. [Schema CSV pentru colecții](#13-schema-csv-pentru-colecții)
14. [Operații bază de date](#14-operații-bază-de-date)
15. [Loguri și monitorizare](#15-loguri-și-monitorizare)
16. [Depanare (Troubleshooting)](#16-depanare-troubleshooting)

---

## 1. Arhitectura sistemului

```
Internet
   │
   ▼
[Nginx :443]  ← reverse proxy + SSL
   │
   ├── /explorer/*  →  [Next.js :3001]  ← aplicația principală
   │                        │
   │                        ├── PostgreSQL :25432  ← baza de date
   │                        └── (server-side env vars)
   │
   └── /titiler/*  →  [TiTiler :8000]  ← vizualizare Cloud Optimized GeoTIFF
                           │
                           └── /data/cog/*  ← fișiere COG pe disk

[GeoServer extern]  ← https://services.geo-spatial.org/geoserver
   └── WMS EPSG:404000  ← scanări originale atlas
```

**Fluxul unui request de item:**
1. Browserul încarcă pagina item → Next.js servește HTML cu metadate din PostgreSQL
2. Tab „Scanare": browserul face cereri WMS direct la GeoServer (EPSG:404000)
3. Tab „Georeferențiat": browserul face cereri tile direct la TiTiler (`/titiler/cog/tiles/...`)

---

## 2. Variabile de mediu (.env)

Fișier: `/storage/volumes/geoserver-1-storage/geo-spatial.org-explorer/.env`

| Variabilă | Valoare | Descriere |
|---|---|---|
| `DATABASE_URL` | `postgresql://explorer:***@localhost:25432/explorer` | Conexiune PostgreSQL |
| `NEXT_PUBLIC_BASE_PATH` | `/explorer` | Prefixul URL al aplicației |
| `NEXT_PUBLIC_SITE_TITLE` | `geo-spatial.org Explorer` | Titlu afișat în browser |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` | URL intern (server-side) |
| `TITILER_URL` | `http://localhost:8000` | URL intern TiTiler (server-side) |
| `NEXT_PUBLIC_TITILER_URL` | `https://services.geo-spatial.org/titiler` | URL public TiTiler (browser) |
| `TITILER_DATA_DIR` | `/data/cog` | Director fișiere COG |
| `NEXT_PUBLIC_GEOSERVER_URL` | `https://services.geo-spatial.org/geoserver` | URL GeoServer |
| `GEOSERVER_WMS_SRS` | `EPSG:404000` | SRS pentru WMS scanări |
| `ADMIN_CREDENTIALS` | `admin:***` | Credențiale login admin |
| `ADMIN_SECRET` | `***` | Secret JWT sesiuni admin |
| `CSV_COLLECTIONS_PATH` | `./data/collections.csv` | Cale CSV colecții (ingest CLI) |
| `CSV_ITEMS_PATH` | `./data/items.csv` | Cale CSV items (ingest CLI) |

> ⚠️ **Important:** După orice modificare în `.env`, aplicația trebuie **rebuild** (`npm run build`) și **restartată** (`pm2 restart geo-spatial-explorer`).

---

## 3. Componenta: Aplicația Next.js

**Locație:** `/storage/volumes/geoserver-1-storage/geo-spatial.org-explorer/`  
**Port:** `3001`  
**Node.js version:** 18+ (verifică cu `node -v`)

### Build

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer
npm run build
```

Build-ul durează ~1-3 minute. Generează folderul `.next/`.  
**Trebuie rulat obligatoriu după:**
- Orice modificare de cod sursă
- Orice modificare în `.env` (variabilele `NEXT_PUBLIC_*`)
- Upgrade de dependențe (`npm install`)

### Start manual (fără PM2)

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer
npm run start -- --port 3001
```

### Mod development (cu hot-reload)

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer
npm run dev
```

> ⚠️ Nu folosi modul dev în producție. Pornire lentă și fără optimizări.

### Instalare dependențe (după clone sau update)

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer
npm install
```

---

## 4. Componenta: Baza de date PostgreSQL

**Host:** `localhost`  
**Port:** `25432`  
**Database:** `explorer`  
**User:** `explorer`  
**Rulat ca:** container Docker (parte din stiva geospatial-services)

### Verificare conexiune

```bash
psql postgresql://explorer:t69uf7O1FsxV@localhost:25432/explorer -c "SELECT COUNT(*) FROM collections;"
```

### Conectare interactivă

```bash
psql postgresql://explorer:t69uf7O1FsxV@localhost:25432/explorer
```

### Drizzle Studio (interfață web DB)

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer
npm run db:studio
```

Deschide browser la `https://local.drizzle.studio` — interfață vizuală pentru inspectat și editat datele direct.

---

## 5. Componenta: PM2 (Process Manager)

PM2 menține aplicația Next.js rulând în background și o repornește automat la crash sau reboot server.

**Config:** `/storage/volumes/geoserver-1-storage/geo-spatial.org-explorer/ecosystem.config.js`  
**Loguri:** `/home/ubuntu/logs/`

### Comenzi esențiale

```bash
# Pornire aplicație
pm2 start /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer/ecosystem.config.js

# Oprire
pm2 stop geo-spatial-explorer

# Restart (după build nou)
pm2 restart geo-spatial-explorer

# Restart complet cu reload env (dacă s-au schimbat variabile .env)
pm2 delete geo-spatial-explorer
pm2 start /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer/ecosystem.config.js

# Status
pm2 status

# Loguri live
pm2 logs geo-spatial-explorer

# Loguri erori
pm2 logs geo-spatial-explorer --err

# Ultimele 100 linii loguri
pm2 logs geo-spatial-explorer --lines 100
```

### Procedura standard de update aplicație

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer

# 1. Build
npm run build

# 2. Oprire port dacă rulează altceva
fuser -k 3001/tcp

# 3. Restart PM2
pm2 restart geo-spatial-explorer

# Sau, dacă pm2 nu rulează încă:
pm2 start ecosystem.config.js
```

### Autostart la reboot server

```bash
pm2 startup
pm2 save
```

---

## 6. Componenta: TiTiler (vizualizare COG)

TiTiler este un serviciu Python care servește tile-uri din fișiere **Cloud Optimized GeoTIFF (COG)** pentru vizualizarea hărților georeferențiate cu fundal cartografic.

**Port intern:** `8000`  
**URL public (prin Nginx):** `https://services.geo-spatial.org/titiler`  
**Rulat ca:** container Docker  
**Config:** `/storage/volumes/geoserver-1-storage/geo-spatial.org-explorer/docker-compose.titiler.yml`

### Pornire

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer
docker compose -f docker-compose.titiler.yml up -d
```

### Oprire

```bash
docker compose -f docker-compose.titiler.yml down
```

### Restart

```bash
docker compose -f docker-compose.titiler.yml restart
```

### Verificare status

```bash
docker ps | grep titiler
# sau
curl http://localhost:8000/healthz
```

### Loguri

```bash
docker logs titiler
docker logs titiler -f        # live
docker logs titiler --tail 50 # ultimele 50 linii
```

### Cum funcționează

1. Fișierele COG se află pe disk la `/data/cog/`
2. Containerul montează `/data` în mod read-only
3. Browserul face cereri de forma:  
   `https://services.geo-spatial.org/titiler/cog/tiles/{z}/{x}/{y}.png?url=/data/cog/fisier.tif`
4. TiTiler citește fișierul COG și returnează tile-ul PNG
5. OpenLayers (din browser) afișează tile-urile pe harta cu fundal OSM

### Cerințe pentru fișierele COG

Fișierele trebuie să fie COG valid. Se pot crea cu GDAL:
```bash
gdal_translate -of COG -co COMPRESS=DEFLATE input.tif /data/cog/output.tif
```

### Nginx — configurare proxy TiTiler

Adaugă în blocul `server {}` din nginx:
```nginx
location /titiler/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 120s;
}
```

---

## 7. Componenta: GeoServer (scanări WMS)

GeoServer este un server geospațial extern care servește scanările originale ale atlaselor prin protocol WMS cu proiecția specială **EPSG:404000** (sistem de coordonate imagine/pixel).

**URL:** `https://services.geo-spatial.org/geoserver`  
**WMS endpoint:** `https://services.geo-spatial.org/geoserver/wms`  
**Proiecție scanări:** `EPSG:404000` (coordonate pixel, extent 0–100000)

### Cum funcționează în aplicație

1. Fiecare item are o resursă de tip `wms_scan` cu:
   - `url` = URL-ul WMS (`https://services.geo-spatial.org/geoserver/wms`)
   - `layerName` = numele layerului din GeoServer (ex: `atlas_agricol:plansa_01`)
2. Browserul face cereri WMS direct la GeoServer
3. `ScanWmsViewer` (OpenLayers) redă imaginea cu slider de opacitate

### Verificare că un layer WMS funcționează

```
https://services.geo-spatial.org/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities
```

---

## 8. Componenta: Nginx (reverse proxy)

Nginx funcționează ca reverse proxy, rutând cererile externe către serviciile interne.

### Configurare relevantă

```nginx
server {
    listen 443 ssl;
    server_name services.geo-spatial.org;

    # Aplicația Next.js
    location /explorer/ {
        proxy_pass http://127.0.0.1:3001/explorer/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # TiTiler
    location /titiler/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 120s;
    }
}
```

### Comenzi Nginx

```bash
# Testare configurație
sudo nginx -t

# Reload configurație (fără downtime)
sudo nginx -s reload

# Restart complet
sudo systemctl restart nginx

# Status
sudo systemctl status nginx
```

---

## 9. Procedura de deploy complet

### De la zero (prima instalare)

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer

# 1. Instalare dependențe Node.js
npm install

# 2. Configurare variabile mediu
cp .env.example .env
# editează .env cu valorile corecte

# 3. Migrare bază de date
npm run db:push

# 4. Build aplicație
npm run build

# 5. Pornire TiTiler
docker compose -f docker-compose.titiler.yml up -d

# 6. Pornire aplicație cu PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 7. Configurare Nginx (adaugă blocurile de proxy)
sudo nginx -t && sudo nginx -s reload
```

### Update aplicație (cod nou)

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer

npm run build
pm2 restart geo-spatial-explorer
```

### Update cu modificări .env

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer

# Modifică .env
nano .env

npm run build

# Restart complet PM2 (reia env-ul)
pm2 delete geo-spatial-explorer
pm2 start ecosystem.config.js
pm2 save
```

---

## 10. Import date CSV

Există două metode de import: **prin interfața web admin** sau **prin CLI**.

### Metoda 1: Import prin interfața admin (recomandat)

1. Mergi la `https://services.geo-spatial.org/explorer/admin`
2. Autentifică-te cu credențialele admin
3. Click pe **„Import CSV"** în meniu
4. Selectează tipul de fișier (Colecții sau Items)
5. Selectează colecția țintă (pentru items)
6. Upload fișier CSV
7. Verifică preview și erorile raportate
8. Click **„Importă"**

### Metoda 2: Import prin CLI

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer

# Setează căile în .env:
# CSV_COLLECTIONS_PATH=./data/collections.csv
# CSV_ITEMS_PATH=./data/items.csv

npm run ingest
```

### Comportament la import

| Situație | Acțiune |
|---|---|
| Item nou (slug inexistent) | INSERT |
| Item existent (slug găsit) | UPDATE metadate + DELETE + RE-INSERT resurse |
| Câmp gol opțional | NULL în bază de date |
| `title` lipsă | Rând respins cu eroare |
| `spatial = "da"` | `georefStatus = "accurate"` |
| `spatial = "nu"` | `georefStatus = "none"` |

---

## 11. Panoul de administrare

**URL:** `https://services.geo-spatial.org/explorer/admin`  
**Credențiale:** `admin` / `gW16k6rEj10w`

### Secțiuni disponibile

| Pagină | URL | Funcționalitate |
|---|---|---|
| Dashboard | `/admin` | Statistici: total colecții, items, georeferențiate |
| Colecții | `/admin/collections` | Listare, căutare, sortare, editare, ștergere colecții |
| Items | `/admin/items` | Listare, filtrare pe colecție, editare, ștergere items |
| Import CSV | `/admin/ingest` | Upload și procesare CSV-uri |

### Editare colecție

1. Mergi la `/admin/collections`
2. Click iconița creion (✏️) de pe rândul colecției
3. Modifică câmpurile dorite (titlu, descriere, thumbnail, an, autor etc.)
4. Click **„Salvează"**

### Ștergere colecție

1. Mergi la `/admin/collections`
2. Click iconița coș (🗑️) → apare buton de confirmare
3. Click **„Confirmă"** → colecția și toate items-urile sale sunt șterse permanent

> ⚠️ **Ștergerea este permanentă** — cascade delete pe toate items și resursele asociate.

### Editare item

1. Mergi la `/admin/items`
2. Filtrează opțional după colecție sau caută după titlu
3. Click iconița creion (✏️)
4. Modifică: titlu, tip, status georeferențiere, an, cuvinte cheie, status publicare etc.
5. Click **„Salvează"**

### Publicare / Unpublish

- **Publicat** (`isPublished = true`): item vizibil în frontend-ul public
- **Draft** (`isPublished = false`): item invizibil publicului, vizibil doar în admin

Câmpul se modifică din checkbox-ul **„Publicat"** în formularul de editare.

---

## 12. Schema CSV pentru items

Fișier: `items.csv`  
Encoding: **UTF-8** (cu sau fără BOM)  
Separator: **virgulă** (`,`)

### Câmpuri suportate

| Coloană | Obligatoriu | Descriere |
|---|---|---|
| `uuid` | Nu | UUID item. Dacă gol, se generează automat |
| `title` | **Da** | Titlul itemului |
| `subtitle` | Nu | Subtitlu |
| `type` | Nu | Tip: `map`, `atlas`, `plan`, `photo`, `document`, `dataset`, `other` |
| `spatial` | Nu | `"da"` = georeferențiat (`accurate`), `"nu"` = nespatializat (`none`) |
| `year` | Nu | Anul (ex: `1938`) |
| `language` | Nu | Cod limbă ISO: `ro`, `en`, `de` |
| `keywords` | Nu | Cuvinte cheie separate prin `\|`, `,` sau `;` |
| `notes` | Nu | Note suplimentare |
| `layer_name` | Nu | Numele layerului georeferențiat în GeoServer (rezervat) |
| `layer_name_scan` | Nu | **Numele layerului scanat în GeoServer** — activează tab „Scanare" |
| `cog_path` | Nu | Calea fișierului COG (ex: `/data/cog/atlas/plansa01.tif`) — activează tab „Georeferențiat" |
| `wms_path` | Nu | URL-ul WMS (ex: `https://services.geo-spatial.org/geoserver/wms`) |
| `thumbnail_path` | Nu | URL thumbnail item (ex: `https://...` sau `/data/thumbnails/...`) |
| `collection_slug` | Nu | Slug-ul colecției (alternativă la selecția din UI) |

### Exemplu rând CSV

```csv
uuid,title,subtitle,type,spatial,year,language,keywords,notes,layer_name,layer_name_scan,cog_path,wms_path,thumbnail_path
,Planșa I — Cultura grâului,Distribuția geografică,map,da,1938,ro,agricultură|grâu|România,,atlas_agricol:plansa_01_georef,atlas_agricol:plansa_01_scan,/data/cog/atlas-agricol-1938/plansa-01.tif,https://services.geo-spatial.org/geoserver/wms,https://cdn.example.com/thumbs/plansa-01.jpg
,Introducere - text,Prefața atlasului,document,nu,1938,ro,,,,,atlas_agricol:introducere_scan,/data/cog/atlas-agricol-1938/introducere.tif,https://services.geo-spatial.org/geoserver/wms,
```

### Logica de vizualizare per item

| `spatial` | `layer_name_scan` | `cog_path` | Tab-uri afișate |
|---|---|---|---|
| `nu` | completat | — | Scanare WMS |
| `da` | completat | — | Scanare WMS |
| `da` | completat | completat | Scanare WMS + Georeferențiat (TiTiler) |
| `nu` | — | — | Nicio resursă vizualizabilă |

---

## 13. Schema CSV pentru colecții

Fișier: `collections.csv`

| Coloană | Obligatoriu | Descriere |
|---|---|---|
| `uuid` | Nu | UUID colecție. Dacă gol, se generează automat |
| `title` | **Da** | Titlul colecției |
| `description` | Nu | Descriere colecție |
| `type` | Nu | Tip: `atlas`, `harta`, `serie` etc. |
| `author` | Nu | Autor/editor principal |
| `institution` | Nu | Instituția sursă |
| `license` | Nu | Licență: `CC BY 4.0`, `Domeniu public` etc. |
| `language` | Nu | Cod limbă: `ro`, `en` |
| `year` | Nu | Anul publicării |
| `keywords` | Nu | Tag-uri, separate prin `,` sau `\|` |
| `thumbnail_path` | Nu | URL thumbnail colecție |
| `catalog_link` | Nu | Link catalog extern (format `Etichetă=URL;Etichetă2=URL2`) |

---

## 14. Operații bază de date

### Aplicare modificări schemă (migrări)

După orice modificare în `src/lib/db/schema.ts`:

```bash
cd /storage/volumes/geoserver-1-storage/geo-spatial.org-explorer

# Generare fișier migrare
npm run db:generate

# Aplicare migrare în baza de date
npm run db:migrate

# Sau (push direct, fără fișier migrare - mai rapid în dev)
npm run db:push
```

### Backup baza de date

```bash
pg_dump postgresql://explorer:t69uf7O1FsxV@localhost:25432/explorer \
  --format=custom \
  --file=/backup/explorer-$(date +%Y%m%d).dump
```

### Restore baza de date

```bash
pg_restore \
  --dbname=postgresql://explorer:t69uf7O1FsxV@localhost:25432/explorer \
  /backup/explorer-20260409.dump
```

### Statistici rapide din baza de date

```sql
-- Număr total colecții și items
SELECT
  (SELECT COUNT(*) FROM collections) AS colectii,
  (SELECT COUNT(*) FROM items) AS items,
  (SELECT COUNT(*) FROM items WHERE georef_status != 'none') AS georeferentiate,
  (SELECT COUNT(*) FROM items WHERE is_published = true) AS publicate;

-- Items pe colecție
SELECT c.title, COUNT(i.id) AS nr_items
FROM collections c
LEFT JOIN items i ON i.collection_id = c.id
GROUP BY c.title
ORDER BY nr_items DESC;

-- Resurse pe tip
SELECT resource_type, COUNT(*) FROM resources GROUP BY resource_type ORDER BY COUNT(*) DESC;
```

---

## 15. Loguri și monitorizare

### Loguri aplicație Next.js (prin PM2)

```bash
# Live
pm2 logs geo-spatial-explorer

# Doar erori
pm2 logs geo-spatial-explorer --err

# Fișiere log
tail -f /home/ubuntu/logs/geo-spatial-explorer-error.log
tail -f /home/ubuntu/logs/geo-spatial-explorer-out.log
tail -f /home/ubuntu/logs/geo-spatial-explorer-combined.log
```

### Loguri TiTiler

```bash
docker logs titiler -f
docker logs titiler --tail 100
```

### Loguri Nginx

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Verificare sănătate servicii

```bash
# Next.js
curl -s -o /dev/null -w "%{http_code}" https://services.geo-spatial.org/explorer

# TiTiler
curl -s http://localhost:8000/healthz

# PostgreSQL
psql postgresql://explorer:t69uf7O1FsxV@localhost:25432/explorer -c "SELECT 1;"

# PM2 status
pm2 status
pm2 monit   # dashboard live
```

---

## 16. Depanare (Troubleshooting)

### Aplicația returnează 404 sau 502

```bash
# Verifică dacă PM2 rulează
pm2 status

# Dacă stopped, pornește
pm2 start ecosystem.config.js

# Verifică portul
ss -tlnp | grep 3001

# Verifică logurile
pm2 logs geo-spatial-explorer --err --lines 50
```

### Build eșuează

```bash
# Curăță cache Next.js și rebuild
rm -rf .next
npm run build
```

### Imaginile (thumbnails) nu se afișează

- Verifică că URL-ul nu conține spații neencodate
- URL-urile cu spații trebuie să folosească `%20` sau să fie encode-uite per segment
- Verifică că domeniul este adăugat în `next.config.js` la `images.domains`

### Tab „Scanare" nu apare

- Verifică că în CSV câmpul `layer_name_scan` este completat
- Verifică că `wms_path` este completat
- Re-importă CSV-ul (resursele `wms_scan` trebuie recreate)
- Verifică în DB: `SELECT * FROM resources WHERE resource_type = 'wms_scan' LIMIT 5;`

### Tab „Georeferențiat" nu apare

- Verifică că `spatial = "da"` în CSV
- Verifică că `cog_path` este completat și fișierul există pe disk
- Verifică că TiTiler rulează: `curl http://localhost:8000/healthz`
- Verifică că Nginx proxy-ează `/titiler/`

### URL-uri duble `/explorer/explorer/`

Cauza: link-urile `<Link>` din Next.js adaugă automat `basePath=/explorer`. Nu trebuie prefixat manual cu `${NEXT_PUBLIC_BASE_PATH}` în componentele `<Link>` sau `router.push()`.  
Regula:
- `<Link href="/admin">` ✅ → Next.js adaugă `/explorer` automat
- `<a href="${base}/admin">` ✅ → adăugăm manual pentru tag-uri `<a>` plain
- `fetch("${base}/api/...")` ✅ → adăugăm manual pentru `fetch()`

### TiTiler nu servește tile-uri

```bash
# Testare directă
curl "http://localhost:8000/cog/info?url=/data/cog/fisier.tif"

# Verifică că fișierul există
ls -la /data/cog/

# Verifică loguri
docker logs titiler --tail 30
```

### Eroare de autentificare admin

- Cookie-ul de sesiune a expirat → re-autentifică-te
- Verifică că `ADMIN_SECRET` din `.env` nu s-a schimbat după generarea token-ului
- Credențialele sunt în `.env` la `ADMIN_CREDENTIALS=admin:parolă`

---

*Manual generat: Aprilie 2026*
