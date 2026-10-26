# demiya.restaurant — marketing site

Static Astro rebuild of the WordPress marketing site, replacing the instance
compromised on 2026-10-23 (`../ffiver/wordpress/INCIDENT-RESTORE-HARDEN.md`).

No PHP, no database, no server. The build emits plain HTML to `dist/`, which
S3 serves through CloudFront. That removes the entire attack class that took
the old site down, and the certbot renewal that silently failed with it.

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # → dist/
```

## Where the content came from

Everything was extracted from the verified-clean backup at
`../ffiver/wordpress/backups/demiya.wpress` — page copy, images, hours,
ordering links, brand colours and fonts. Nothing was invented.

The extraction tooling lives in this session's scratchpad (`unwpress.py`, a
`.wpress` archive parser, and `elementor.py`, which walks a page's
`_elementor_data` JSON). Re-run them if you need anything else out of the
backup; the source pages are Home `id=8`, Hours `id=27`, Locations & Order
`id=30`, Header `id=37`, Footer `id=41`.

| File | Holds |
|------|-------|
| `src/data/content.ts` | All page copy — hero, story, dishes, gallery, section headings |
| `src/data/locations.ts` | Five locations: addresses, hours, Toast order URLs, Maps links |
| `src/data/site.ts` | Tagline, support number, Instagram, nav, copyright |
| `src/assets/` | 19 images lifted from `wp-content/uploads/2026/06/` |

**Location data is deliberately not read from the Soux Postgres `locations`
table.** Those rows are operational records for the POS; these are the public
listings. They drift on purpose — the POS knows dayparts and tax rates, this
knows what the sign on the door says. To change the website, edit the file
and push.

Two details worth protecting when you edit:

- **The published phone takes texts only.** The original footer read
  "Customer support: text only at +1 (408) 499-1250". Dropping that qualifier
  sends people to a number that will not answer.
- **Venue notes matter.** "inside 99 Ranch" and "The Public Market" are how
  people actually find those two units.

## Structure, matching the original

| URL | Page | Was |
|-----|------|-----|
| `/` | Home | `home` (id 8) |
| `/hours/` | Our Hours | `hours` (id 27) |
| `/locations-order/` | Locations & Order | `locations-order` (id 30) |
| `/contact/` | Contact (text line) | *new* |

URLs match the WordPress paths, so existing inbound links and whatever
search ranking survives the cleanup carry over without redirects.

The contact page is additive and points to the SMS line, which is how every
customer contact actually arrives. A contact form was built and removed: the
old site's form received zero emails. It is linked from the footer rather than
the header so the primary nav stays as it was.

## Brand

Lifted from the Elementor global palette, so the rebuild matches the site
people already recognise. Tailwind v4 tokens in `src/styles/global.css`:

| Token | Hex | Role |
|-------|-----|------|
| `cream` | `#FBF5F0` | page ground |
| `maroon` | `#3B1A1A` | text and headings |
| `brick` | `#C0392B` | accent, calls to action |
| `rosewood` | `#7B3F3F` | secondary text |
| `espresso` | `#1E0E0A` | hero overlay, footer |
| `blush` | `#E8D5C8` | rules and fills |

Type is the original pairing: **Playfair Display** display, **DM Sans** body.
The hero uses `Demiya_Hero-scaled.jpg` under an espresso overlay at 72%,
close to Elementor's 52%-opacity `#1E0E0AB8`.

Images go through `astro:assets`, so the 22 MB of source JPEGs and PNGs ship
as responsive WebP — the whole built site is about 11 MB, and the home page
loads no JavaScript at all.

## Google reviews

The original used the **Trustindex** WordPress plugin, which loaded
`cdn.trustindex.io/loader.js` at runtime but cached the review text into the
page HTML. Those four reviews were extracted from that cache and now ship as
static markup in `src/data/reviews.ts` — same content, no third-party script,
no runtime JavaScript. The layout reproduces Trustindex's 300px slider with
CSS scroll-snap.

> **This snapshot is stale** — the reviews date from Feb–May 2026. Refresh the
> text before launch.

To make them self-updating, replace `src/data/reviews.ts` with a build-time
fetch from the Google Places API. The exported type already matches what
Places returns (`author_name` → `author`, `rating`, `time` → `date`, `text`),
so nothing else changes. Caveats: Places returns at most 5 reviews and you
cannot choose which, and its policy caps caching at 30 days — pair it with a
monthly scheduled rebuild.

**Google's terms require attribution.** Each card carries the Google mark and
"Posted on Google". Keep it.

## Still to port

- **DEMI Palo Alto link.** The header and footer both linked a sister
  restaurant, but the backup preserved only the slug (`bistro-demiya`), not
  the destination. `site.demiPaloAlto.url` is `"#"` — **confirm the real URL
  before launch.**
- **The blog post.** "Hello world!" is the WordPress default, so there is
  nothing real to carry over. Add `src/pages/blog/` if the restaurant wants
  posts.
- **Privacy Policy.** Existed as a draft, never published.

## Deploying

Infrastructure and the deploy pipeline are in `infra/` — S3, CloudFront, ACM,
Route 53, and a GitHub Actions OIDC role. See
`infra/README.md`.

Push to `main` and `.github/workflows/deploy.yml` builds, syncs to S3, and
invalidates CloudFront.

## Structure

```
src/
  assets/        images from the backup
  data/          content.ts, locations.ts, site.ts — all copy and data
  layouts/       BaseLayout: head, header, footer
  components/    Section, PageHero, LocationCard, InstagramCta
  pages/         index, hours, locations-order, contact, 404
  styles/        global.css — Tailwind v4 + brand tokens
infra/           Terraform (see infra/README.md)
```
