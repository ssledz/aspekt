# Specification — Apartment Rental Landing Page (Jekyll + GitHub Pages)

## 0. Photo Renaming (done ✅)

**Convention adopted:** `<NN>.jpg` (zero-padded, 2-digit sequence) inside each sub-folder. Extensions normalized
`.jpeg` → `.jpg`.

- 8 folders, 122 files renamed. No data lost.
- **Duplicate removed:** `lazienka/09.jpg` was a byte-for-byte copy of `lazienka/10.jpg` (was
  `PHOTO-2025-09-22-16-08-17(2) (kopia).jpg`) — deleted and the folder renumbered to a contiguous 19 files.
- **Why this convention:** deterministic ordering via filename sort, trivially re-orderable by renaming,
  extension-consistent for Liquid filters, safe for `where_exp` folder matching.
- **⚠️ Note:** name-sort groups iPhone `IMG_*` shots before WhatsApp `PHOTO-*` shots, which may not be strictly
  chronological. Reorder later by renaming `NN.jpg` if a curated tour order is wanted.

---

## 1. Project Structure

```
aspekt/
├── _config.yml                 # site config, baseurl, galleries list
├── Gemfile                     # pin github-pages gem
├── _data/
│   └── i18n.yml                # all PL/EN strings (offer text, nav, gallery labels)
├── _plugins/
│   └── gallery_generator.rb    # build-time: discovers photos + generates thumbnails → site.data.gallery
├── _layouts/
│   ├── default.html            # <head>, CSS/JS includes, language toggle, nav, footer
│   └── home.html               # landing page composition
├── _includes/
│   ├── gallery.html            # renders a gallery grid (reused for sub + global)
│   └── lightbox.html           # GLightbox init JS (loop toggle, arrows)
├── index.html                  # landing page (hero + offer + gallery entry point)
├── gallery.html                # gallery selection page (folder tabs + "all")
├── assets/
│   ├── css/main.scss           # custom styles (baleon-inspired)
│   ├── js/gallery.js           # gallery interactivity
│   ├── img/                    # hero/cover images
│   └── photo-gallery/          # ← existing, 8 sub-folders (now NN.jpg)
│       ├── salon/           (28)
│       ├── aneks-kuchenny/  (21)
│       ├── lazienka/        (19)
│       ├── sypialnia/       (18)
│       ├── pokoj-dzieci/    (17)
│       ├── korytarz/        (10)
│       ├── balkon/          (6)
│       └── garaz/           (3)
├── 404.html
└── .github/workflows/          # optional (see §7)
```

---

## 2. Tech Stack Decisions

| Concern            | Decision                                               | Rationale                                                                                                                                     |
|--------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **Lightbox**       | **GLightbox** (MIT, ~11 KB gzip, CDN)                  | Loop (default off), arrow nav, swipe/touch, keyboard, multi-gallery via `data-gallery`, responsive via `data-srcset`. MIT = free for any use. |
| **Gallery data**   | **Custom Jekyll generator plugin** → `site.data.gallery` | Auto-discovers every photo in `assets/photo-gallery/` at build time, controls ordering/captions, no manual data file.                         |
| **Theme**          | **Custom layout** (no gem theme)                       | Landing page is bespoke; blog themes add opinions you'd fight.                                                                                |
| **Responsive img** | **Build-time generation (ImageMagick) via the plugin** | Thumbnails + `srcset` sizes generated automatically during `jekyll build` — no manual step. Requires Actions (see §9).                       |
| **i18n**           | `_data/i18n.yml` + `data-i18n` attributes + vanilla JS | PL default, EN toggle without separate URLs.                                                                                                  |

**Key constraint (and why Actions is mandatory):** GitHub Pages' *classic* build runs in `--safe` mode with a small
plugin whitelist (`jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`, `jekyll-remote-theme`, etc.) — **no custom `.rb`
plugins, no image processing.** Because this project requires build-time thumbnail generation (a custom generator
plugin), we **must use GitHub Actions** as the Pages build source (see §9), which lifts the whitelist entirely.

---

## 3. Pages & Navigation

1. **`index.html` (Landing)** — hero, offer text, gallery call-to-action.
2. **`gallery.html` (Gallery)** — folder selector + global "all photos" view.

Both share `_layouts/default.html` for nav, language toggle, footer.

---

## 4. Landing Page (baleon-inspired)

Baleon (Artem Sheludko) is a clean portfolio with: sticky top nav, large hero typography, generous whitespace, muted
neutral palette, subtle animations, section rhythm. Adapted here as a **single-page rental landing**:

- **Hero:** "Wynajmę 3-pokojowe mieszkanie 58 m²" headline + one-line hook + primary CTA **"Zobacz galerię"** + a hero
  image (a salon photo).
- **Offer section:** the formatted OLX-style content (rooms, equipment, extras, fees) — rendered from `_data/i18n.yml`
  as structured data (not a raw HTML blob) so it is beautiful and translatable.
- **Gallery teaser (the "don't miss it" part):** a prominent, above-the-fold visual strip — a 3–6 photo preview grid
  with a bold **"Zobacz wszystkie zdjęcia →"** button. Plus a sticky/CTA button in the hero. Two independent entry
  points so it is impossible to miss.
- **Footer:** contact prompt, fees recap.

Design language: neutral palette (off-white/dark), strong typographic hierarchy, large radius cards, hover lift on
gallery thumbs.

---

## 5. Gallery Architecture (core requirement)

**Data model** — `_config.yml`:

```yaml
galleries:
  - { id: salon,          title: { pl: Salon, en: Living room } }
  - { id: aneks-kuchenny, title: { pl: Aneks kuchenny, en: Kitchenette } }
  - { id: sypialnia,      title: { pl: Sypialnia, en: Bedroom } }
  - { id: pokoj-dzieci,   title: { pl: Pokój dziecięcy, en: Kids room } }
  - { id: lazienka,       title: { pl: Łazienka, en: Bathroom } }
  - { id: korytarz,       title: { pl: Korytarz, en: Hallway } }
  - { id: balkon,         title: { pl: Balkon, en: Balcony } }
  - { id: garaz,          title: { pl: Garaż, en: Garage } }
```

**Enumeration is fully automatic** — no manual data file. A custom generator plugin
(`_plugins/gallery_generator.rb`) runs at build time, walks `assets/photo-gallery/**/*.{jpg,jpeg}`, and:

1. **Discovers** every photo (so adding a file to any folder = it appears in the gallery with zero manual steps).
2. **Generates** a thumbnail + `srcset` display sizes for any photo that lacks them (idempotent — skipped if already
   up to date; see §8).
3. **Emits** `site.data.gallery` — a flat, ordered list of `{ folder, title, thumb, full, srcset }` — consumed by
   templates. Ordering: folder order from `_config.yml` `galleries`, then `NN.jpg` within each folder.

Templates iterate `site.data.gallery` (not `site.static_files` directly), which also sidesteps the "static_files
includes generated derivatives" problem — the generator knows which files are originals vs. derived.

```liquid
{% for photo in site.data.gallery %}
  <a href="{{ photo.full | relative_url }}" class="glightbox"
     data-gallery="{{ photo.folder }}">
    <img src="{{ photo.thumb | relative_url }}" alt="{{ photo.folder }} {{ photo.name }}" loading="lazy">
  </a>
{% endfor %}
```

**Important:** `site.data.gallery` can only be produced by a plugin — that is why GitHub Actions (not classic Pages)
is the required deploy target.

**Two browsing modes** — the gallery has a directory mode and a viewer mode:

### 5a. Directory mode (thumbnail grid — primary browsing surface)

Every photo gets a **generated thumbnail** (see §8). The directory mode is a responsive thumbnail grid used to
*scan* photos before opening them.

**Two scopes, switchable via tabs/chips:**

1. **Per directory** — one tab per folder (`salon`, `aneks-kuchenny`, …). Selecting a folder shows only that
   folder's thumbnails. Clicking a thumbnail opens the lightbox scoped to that folder (`data-gallery="<id>"`),
   so arrows navigate *within* the folder.
2. **Virtual "all photos" directory** — a "Wszystkie / All" tab that flattens all 8 folders into **one virtual
   directory** (all 122 photos in a single grid). Every thumbnail carries `data-gallery="all"`, so arrows navigate
   across the entire set, in a stable order (folder order, then `NN.jpg` within each folder).

Implementation note: this is a single `gallery.html` page using **client-side filtering** — the build-time generator
emits one flat, ordered array `site.data.gallery` (`{ folder, title, thumb, full, srcset }` for all photos), inlined as
JSON. The tab switch is pure JS (show/hide grid items + reassign the active GLightbox group), so switching directories
is instant and requires no page reload. Thumbnails are `loading="lazy"` so the 122-photo "all" grid stays fast.

**Lightbox viewer (GLightbox):**

- **Loop toggle:** a switch in the gallery toolbar. Default **off**. When on, GLightbox wraps (`loop: true`) and drives
  a slideshow via `setInterval` + `nextSlide()` (GLightbox has no native autoplay — ~10 lines of JS).
- **Arrow navigation:** GLightbox built-in `keyboardNavigation` + on-screen prev/next **side arrows** (always visible on
  desktop, also rendered on lightbox edges — GLightbox shows them by default; style/enlarge them).
- **Swipe/keyboard:** `touchNavigation`, `keyboardNavigation`, Esc to close.
- **Responsive:** `data-srcset` + `data-sizes` per image; `loading="lazy"` thumbnails.

**Ordering guarantee:** filenames are `NN.jpg`, and `| sort: 'path'` ensures deterministic order per folder.

---

## 6. i18n (PL default, EN toggle)

- All copy lives in `_data/i18n.yml` keyed `pl` / `en` (nav, hero, offer sections, gallery labels, fees, CTA).
- **Offer text:** the OLX snippet is transcribed as structured YAML (headline, intro, `rooms:` list, `equipment:` list,
  `extras:` list, `fees:` list, availability note) — translated to English once — then rendered by Liquid. This keeps it
  beautiful *and* translatable (rather than a raw HTML block).
- **Toggle:** a button in nav switches language; a tiny vanilla-JS swaps text on `[data-i18n="key"]` nodes from the
  `i18n.yml` data (inlined as JSON). PL is the default `lang="pl"`. No page reload; optionally persists in
  `localStorage`.

---

## 7. Responsive Strategy (mobile → TV)

- CSS Grid gallery: `repeat(auto-fill, minmax(280px, 1fr))` thumbnails.
- Breakpoints: mobile (<640px) 1–2 cols, tablet 3, desktop 4, large/TV 5–6 with a **max-width container (~1440px)** so
  it does not stretch absurdly on TVs — large hero type scales with `clamp()`.
- Lightbox full-screen on all sizes; images served with `srcset` (320/640/960/1600) so phones load small files, TVs get
  full res.
- Touch swipe for mobile, keyboard for desktop, both for TV remotes (arrows).

---

## 8. Image Pipeline — build-time thumbnail generation (drop a photo, done)

The pipeline is **fully automatic**: to add a new photo, drop it into the right folder and push. The build generates
everything. Raw iPhone shots are 4032×3024 @ ~2.4 MB (total 86 MB), so generation downscales for the web.

**How it works** — `_plugins/gallery_generator.rb` (a Jekyll `Generator`) runs during `jekyll build`, shells out to
**ImageMagick** (`magick` / `convert`), and for **every** original `assets/photo-gallery/**/NN.jpg` produces:

- **Thumbnail** — `NN-th.jpg`, ~400 px wide (WebP optional), used by the directory-mode grid (`loading="lazy"`).
- **Display sizes** — `NN-320.jpg`, `NN-640.jpg`, `NN-960.jpg`, `NN-1600.jpg` for `srcset` in the lightbox.

**Idempotency & speed:** the generator writes each derivative only if it is missing or stale (compares `mtime` of the
derivative vs. the original). On a fresh CI run nothing exists → all generated; on a local `jekyll serve` after adding
one photo → only that photo's derivatives are created. A `_site`-cached, timestamp-checked approach keeps rebuilds fast.

**Where derivatives live & git policy:**

- **Originals** (`assets/photo-gallery/**/NN.jpg`) — committed (they are the source of truth).
- **Derivatives** (`*-th.jpg`, `*-320.jpg`, …) — written into `_site` (not `assets/`) OR into `assets/` but
  **`.gitignore`d** — never committed, since they're regenerated every build.

**Rendered output:** grid uses `<img src="NN-th.jpg">`; lightbox uses
`src="NN-640.jpg" srcset="NN-320.jpg 320w, NN-640.jpg 640w, NN-960.jpg 960w, NN-1600.jpg 1600w"`.

**⚠️ Repo size:** the 86 MB of originals is well under GitHub's 1 GB soft limit and 100 MB/file hard limit (largest
file ~2.4 MB), so committing originals is safe. The generated derivatives are *not* committed, keeping the repo lean.

**Local dev requirement:** `jekyll serve` will regenerate thumbnails via the plugin, so ImageMagick must be installed
locally (`brew install imagemagick` / `apt install imagemagick`). It is preinstalled on GitHub's `ubuntu-latest` runners.

---

## 9. Deployment on GitHub Pages

**Deployment: GitHub Actions (REQUIRED — not optional).** The build-time thumbnail generator is a custom plugin, which
classic Pages (safe mode) forbids. Use **Settings → Pages → Source = GitHub Actions** with a workflow that:

1. Checks out the repo.
2. Sets up Ruby (`ruby/setup-ruby`) with `bundler-cache: true`.
3. Runs `bundle exec jekyll build` — this executes `gallery_generator.rb`, generating thumbnails/`srcset` and emitting
   `site.data.gallery`.
4. Uploads `_site` (`actions/upload-pages-artifact`) and deploys (`actions/deploy-pages`), with
   `permissions: { pages: write, id-token: write }`.

`_config.yml` still sets `baseurl: "/aspekt"` (project site → `ssledz.github.io/aspekt/`), and all asset URLs use
`relative_url`.

**Why not classic Pages:** its `--safe` whitelist blocks custom `.rb` generators, so it could never run the
thumbnail/gallery generator. Classic Pages is only viable if thumbnails were pre-generated and committed — which
contradicts the "drop a photo, it just works" requirement.

**Local preview:** `bundle exec jekyll serve` (with ImageMagick installed) reproduces the exact build locally.

**Custom domain (optional):** if a real domain is wanted instead of `ssledz.github.io/aspekt/`, add a CNAME + repo
`CNAME` file; then `baseurl: ""`. Not assumed — flag if needed.

---

## 10. Implementation Roadmap (phased)

1. **Scaffold** Jekyll skeleton (`Gemfile`, `_config.yml`, layouts, `main.scss`) — local `bundle exec jekyll serve`.
2. **i18n data** — transcribe offer into `i18n.yml` (PL + EN translation).
3. **Landing page** — hero, offer sections, gallery teaser + CTA.
4. **Gallery generator plugin** — `_plugins/gallery_generator.rb`: discover photos, generate thumbnails/`srcset`
   (ImageMagick), emit `site.data.gallery`.
5. **Gallery page** — folder tabs, client-side directory mode (per-directory + virtual "all" grid) driven by
   `site.data.gallery`.
6. **Lightbox** — GLightbox CDN, loop toggle, side arrows, swipe/keyboard.
7. **Responsive pass** — breakpoints, TV scaling, `srcset`.
8. **Deploy** — GitHub Actions workflow (generate → build → deploy); verify `baseurl`; optional custom domain.

---

## 11. Open Questions / Decisions

1. **Originals in repo** — ✅ Commit the 86 MB originals as source of truth (well under 1 GB repo / 1 GB Pages limits).
2. **Language default** — ✅ Polish (default) with EN toggle.
3. **Custom domain** — ✅ Start with `ssledz.github.io/aspekt/` (project site, `baseurl: "/aspekt"`). Custom domain
   deferred — revisit later.
4. **Gallery entry** — ✅ Landing-page teaser opens `gallery.html` (gallery page owns the directory mode).
5. **Directory-mode default scope** — ✅ `gallery.html` opens on "all photos" (virtual directory).
6. **Thumbnail format** — ✅ JPG (no alpha needed). WebP deferred — revisit if size becomes an issue.
