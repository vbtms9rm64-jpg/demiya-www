/**
 * One-shot generator for the static location maps.
 *
 * Replaces the original site's five embedded Google Maps iframes. Geocodes
 * each address with Nominatim, works out which OpenStreetMap tiles cover a
 * viewport centred on it, and saves those tiles into
 * `src/assets/maps/<slug>/`. LocationDetailCard then composes them with CSS,
 * so the published page makes no third-party request at all.
 *
 * Run once (or whenever an address changes):
 *
 *     node scripts/fetch-maps.mjs
 *
 * Tiles are fetched a handful of times and then served from our own origin,
 * so OSM's servers see no ongoing load. Attribution is required and is
 * rendered on every map — see LocationDetailCard.astro.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const UA = "demiya.restaurant static map builder (contact: website@demiya.restaurant)";
const TILE = 256;
const VIEW_W = 640;
const VIEW_H = 320;
const OUT = path.join(process.cwd(), "src/assets/maps");
const META = path.join(OUT, "maps.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Web-mercator: lat/lon → world pixel coordinates at a zoom level. */
function project(lat, lon, z) {
  const scale = TILE * 2 ** z;
  const x = ((lon + 180) / 360) * scale;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

async function geocode(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`geocode ${res.status} for ${query}`);
  const hits = await res.json();
  if (!hits.length) throw new Error(`no geocode result for ${query}`);
  return { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon) };
}

async function fetchTile(z, x, y, dest) {
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`tile ${res.status} ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

// Addresses and zooms are the ones the original's map widgets used.
const TARGETS = [
  { slug: "saratoga", q: "375 Saratoga Ave, San Jose, CA 95129", z: 16 },
  { slug: "cupertino", q: "1145 S De Anza Blvd, San Jose, CA 95129", z: 15 },
  { slug: "dublin", q: "7477 Village Pkwy, Dublin, CA 94568", z: 15 },
  { slug: "fremont", q: "46551 Mission Blvd, Fremont, CA 94539", z: 15 },
  { slug: "emeryville", q: "5959 Shellmound St, Emeryville, CA 94608", z: 15 },
];

const meta = {};

for (const t of TARGETS) {
  const dir = path.join(OUT, t.slug);
  await mkdir(dir, { recursive: true });

  const { lat, lon } = await geocode(t.q);
  await sleep(1100); // Nominatim asks for <= 1 request/second

  const c = project(lat, lon, t.z);
  const left = c.x - VIEW_W / 2;
  const top = c.y - VIEW_H / 2;

  const x0 = Math.floor(left / TILE);
  const y0 = Math.floor(top / TILE);
  const x1 = Math.floor((left + VIEW_W) / TILE);
  const y1 = Math.floor((top + VIEW_H) / TILE);

  const tiles = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const name = `${x}_${y}.png`;
      const dest = path.join(dir, name);
      if (!existsSync(dest)) {
        await fetchTile(t.z, x, y, dest);
        await sleep(250);
      }
      tiles.push({ name, left: x * TILE - left, top: y * TILE - top });
    }
  }

  meta[t.slug] = {
    lat,
    lon,
    zoom: t.z,
    width: VIEW_W,
    height: VIEW_H,
    // Marker sits at the centre of the viewport by construction.
    markerX: VIEW_W / 2,
    markerY: VIEW_H / 2,
    tiles,
  };
  console.log(`${t.slug}: ${tiles.length} tiles @ z${t.z} (${lat}, ${lon})`);
}

await writeFile(META, JSON.stringify(meta, null, 2) + "\n");
console.log(`\nwrote ${META}`);
