# geo-spatial.org Explorer

Aplicație web pentru catalogarea, explorarea și vizualizarea interactivă a colecțiilor de hărți istorice, atlase și seturi de date geospațiale publicate pe [explorer.geo-spatial.org](https://explorer.geo-spatial.org).

---

## Arhitectură și Tehnologii

- **Frontend & Backend:** [Next.js 14](https://nextjs.org/) (App Router, TypeScript, Tailwind CSS, Radix UI)
- **Bază de date:** PostgreSQL (14+) + [Drizzle ORM](https://orm.drizzle.team/) (cu indecși GIN full-text search pentru limba română)
- **Vizualizare cartografică:**
  - [OpenLayers](https://openlayers.org/) & [MapLibre GL](https://maplibre.org/)
  - [TiTiler](https://developmentseed.org/titiler/) — server de tile-uri dinamice pentru fișiere Cloud Optimized GeoTIFF (COG)
  - [GeoServer](https://geoserver.org/) — serviciu WMS pentru scanările brute (negeoreferențiate, în coordonate pixel `EPSG:404000`) și straturi geospațiale

---

## Cuprins

1. [Cerințe preliminare](#1-cerințe-preliminare)
2. [Instalare și configurare de la zero](#2-instalare-și-configurare-de-la-zero)
3. [Configurarea bazei de date PostgreSQL și a schemei](#3-configurarea-bazei-de-date-postgresql-și-a-schemei)
4. [Variabile de mediu (`.env`)](#4-variabile-de-mediu-env)
5. [Pornirea aplicației (Development, Production sau Docker)](#5-pornirea-aplicației-development-production-sau-docker)
6. [Serviciul TiTiler (pentru hărți georeferențiate COG)](#6-serviciul-titiler-pentru-hărți-georeferențiate-cog)
7. [Importul datelor (CSV / Panou Admin)](#7-importul-datelor-csv--panou-admin)
8. [Structura proiectului și documentație suplimentară](#8-structura-proiectului-și-documentație-suplimentară)

---

## 1. Cerințe preliminare

- **Node.js** `>= 20.x` și **npm**
- **PostgreSQL** `>= 14` (local sau în container Docker)
- **Docker** & **Docker Compose** (opțional, pentru rularea aplicației în container și pentru serviciul TiTiler)

---

## 2. Instalare și configurare de la zero

Clonează repository-ul și instalează dependențele:

```bash
git clone https://github.com/geospatialorg/explorer.git
cd explorer
npm install
```

Copiază fișierul exemplu de variabile de mediu:

```bash
cp .env.example .env
```

---

## 3. Configurarea bazei de date PostgreSQL și a schemei

Schema bazei de date este definită în [`src/lib/db/schema.ts`](src/lib/db/schema.ts) folosind **Drizzle ORM**, iar migrările SQL se află în [`src/lib/db/migrations/`](src/lib/db/migrations/).

Schema conține 4 tabele principale:
- `collections` — colecțiile de hărți/date (cu index GIN full-text search pe titlu, descriere, autor)
- `items` — elementele individuale (planșe, hărți, foi de atlas) asociate unei colecții
- `resources` — resursele aferente fiecărui item (linkuri de descărcare, straturi WMS, fișiere COG, derivate vectoriale)
- `slug_redirects` — redirectări automate la schimbarea slug-urilor

### Pasul 1: Crearea bazei de date PostgreSQL

Poți porni o instanță PostgreSQL rapid cu Docker:

```bash
docker run -d \
  --name explorer-postgres \
  -e POSTGRES_USER=explorer \
  -e POSTGRES_PASSWORD=parola_locala \
  -e POSTGRES_DB=explorer \
  -p 5432:5432 \
  postgres:16-alpine
```

Sau, dacă ai deja PostgreSQL instalat, creează utilizatorul și baza de date din `psql`:

```sql
CREATE USER explorer WITH PASSWORD 'parola_locala';
CREATE DATABASE explorer OWNER explorer ENCODING 'UTF8';
```

Actualizează `DATABASE_URL` în fișierul `.env`:

```env
DATABASE_URL="postgresql://explorer:parola_locala@localhost:5432/explorer"
```

### Pasul 2: Crearea tabelelor în baza de date (Schema Push / Migrate)

Ai două metode pentru a inițializa schema în baza de date:

#### Varianta A: Sincronizare directă din schema Drizzle (recomandat la instalare nouă)
```bash
npm run db:push
```
Această comandă citește [`src/lib/db/schema.ts`](src/lib/db/schema.ts) și creează automat toate tabelele, cheile străine și indecșii în baza de date.

#### Varianta B: Rularea migrărilor SQL din `src/lib/db/migrations/`
```bash
npm run db:migrate
```

> **Inspecție vizuală a bazei de date:** Poți deschide oricând interfața web Drizzle Studio rulând:
> ```bash
> npm run db:studio
> ```

---

## 4. Variabile de mediu (`.env`)

Configurează fișierul `.env` conform mediului tău:

| Variabilă | Exemplu | Descriere |
|---|---|---|
| `DATABASE_URL` | `postgresql://explorer:parola@localhost:5432/explorer` | String-ul de conectare la PostgreSQL |
| `NEXT_PUBLIC_BASE_PATH` | `""` (sau `/explorer` în spatele unui reverse proxy) | Sub-calea URL pe care este servită aplicația |
| `NEXT_PUBLIC_SITE_TITLE` | `geo-spatial.org Explorer` | Titlul aplicației |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | URL-ul de bază al aplicației |
| `TITILER_URL` | `http://localhost:8000` | URL-ul intern către serviciul TiTiler |
| `NEXT_PUBLIC_TITILER_URL` | `http://localhost:8000` | URL-ul public TiTiler apelat din browser |
| `TITILER_DATA_DIR` | `/data/cog` | Directorul în care TiTiler citește fișierele COG |
| `NEXT_PUBLIC_GEOSERVER_URL` | `https://services.geo-spatial.org/geoserver` | URL-ul de bază al instanței GeoServer |
| `GEOSERVER_WMS_SRS` | `EPSG:404000` | Proiecția WMS folosită pentru scanările negeoreferențiate |
| `ADMIN_CREDENTIALS` | `admin:schimba-parola` | Utilizator și parolă pentru panoul `/admin` (`user:pass`) |
| `ADMIN_SECRET` | `un-sir-random-de-minim-32-caractere` | Secret folosit la semnarea sesiunii de administrare |
| `DEFAULT_LOCALE` | `ro` | Limba implicită a interfeței |
| `SUPPORTED_LOCALES` | `ro,en` | Limbile suportate |

---

## 5. Pornirea aplicației (Development, Production sau Docker)

### A. Modul Development (cu hot-reload)

```bash
npm run dev
```
Aplicația va porni pe **`http://localhost:3000`**.

### B. Modul Production (Node.js direct)

Pentru a porni serverul Next.js în mod producție (`npm run start`), este obligatorie compilarea prealabilă a aplicației:

```bash
npm run build
npm run start
```
Aplicația va porni pe **`http://localhost:3001`**.

### C. Rulare în container Docker

Proiectul include un [`Dockerfile`](Dockerfile) multi-stage (bazat pe `node:20-alpine` și output Next.js `standalone`).

```bash
# 1. Construiește imaginea Docker
docker build -t geospatialorg-explorer \
  --build-arg NEXT_PUBLIC_BASE_PATH="" \
  --build-arg NEXT_PUBLIC_SITE_TITLE="geo-spatial.org Explorer" \
  --build-arg NEXT_PUBLIC_SITE_URL="http://localhost:3001" \
  --build-arg NEXT_PUBLIC_TITILER_URL="http://localhost:8000" \
  --build-arg NEXT_PUBLIC_GEOSERVER_URL="https://services.geo-spatial.org/geoserver" \
  .

# 2. Pornește containerul
docker run -d --name geospatialorg-explorer \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  --env-file .env \
  -p 3001:3000 \
  geospatialorg-explorer
```

> **Notă pentru Docker:** Dacă PostgreSQL rulează direct pe mașina gazdă (nu în aceeași rețea Docker), folosește `host.docker.internal` în loc de `localhost` în `DATABASE_URL` (vezi [`.env.production.example`](.env.production.example)).

---

## 6. Serviciul TiTiler (pentru hărți georeferențiate COG)

Pentru afișarea pe hartă a fișierelor Cloud Optimized GeoTIFF (COG), poți porni serviciul TiTiler folosind fișierul [`docker-compose.titiler.yml`](docker-compose.titiler.yml):

```bash
docker compose -f docker-compose.titiler.yml up -d
```

Acesta va expune TiTiler pe `http://localhost:8000` și va monta directorul `/data` în mod read-only pentru citirea fișierelor `.tif`.

---

## 7. Importul datelor (CSV / Panou Admin)

Datele (colecții și elemente/hărți) pot fi adăugate sau importate în două moduri:

1. **Prin interfața web de administrare (`/admin`):**
   - Accesează `http://localhost:3000/admin` (sau `/explorer/admin` în producție).
   - Autentifică-te folosind credențialele setate în `ADMIN_CREDENTIALS`.
   - Folosește secțiunea **Import CSV** pentru a încărca fișiere CSV cu colecții sau items, ori adaugă/editează înregistrările direct din interfață.

2. **Prin linia de comandă (CLI):**
   - Setează căile către fișierele CSV în `.env` (`CSV_COLLECTIONS_PATH` și `CSV_ITEMS_PATH`).
   - Rulează:
     ```bash
     npm run ingest
     ```

Detaliile complete despre coloanele acceptate în fișierele CSV se găsesc în [`docs/11-CSV-SCHEMA.md`](docs/11-CSV-SCHEMA.md) și în [`MANUAL.md`](MANUAL.md).

---

## 8. Structura proiectului și documentație suplimentară

```text
├── src/
│   ├── app/                  # Rutele Next.js App Router (pagini publice, API, /admin)
│   ├── components/           # Componente UI și viewere cartografice (OpenLayers / WMS / COG)
│   └── lib/
│       └── db/
│           ├── schema.ts     # Schema bazei de date PostgreSQL (Drizzle ORM)
│           ├── migrations/   # Migrări SQL generate cu drizzle-kit
│           └── queries/      # Interogări baze de date
├── scripts/
│   └── ingest.ts             # Script CLI pentru importul de colecții și items din CSV
├── docs/                     # Documentație tehnică detaliată (arhitectură, model de date, API)
├── Dockerfile                # Build multi-stage pentru containerul Next.js
├── docker-compose.titiler.yml# Configurație Docker Compose pentru TiTiler
└── MANUAL.md                 # Manual extins de operare și administrare
```
