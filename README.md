# Aspekt — Apartment Rental Landing Page

A static landing page for a 3-room apartment rental offer, built with [Jekyll](https://jekyllrb.com/) and deployed to GitHub Pages. It features a responsive photo gallery with automatic thumbnail generation, Polish/English language toggle, and a lightbox viewer.

Live site: <https://ssledz.github.io/aspekt/>

## Features

- **Landing page** with the rental offer (rooms, equipment, highlights, fees) in Polish and English
- **Photo gallery** grouped into sub-galleries by folder (living room, kitchenette, bedroom, …) plus a combined "all photos" view
- **Automatic image pipeline** — drop a photo into a folder, and the build generates thumbnails + responsive sizes with no manual steps
- **Lightbox viewer** (GLightbox) with arrow navigation, keyboard/swipe support, and an optional slideshow loop (off by default)
- **Responsive** design that looks good on mobile, tablet, desktop, and large TVs

## How the gallery works

Photos live in `assets/photo-gallery/<folder>/NN.jpg`, where `NN` is a zero-padded sequence number (e.g. `01.jpg`, `02.jpg`). At build time, a custom Jekyll generator plugin (`_plugins/gallery_generator.rb`):

1. discovers every original `NN.jpg` in every folder,
2. generates a thumbnail (`NN-th.jpg`) and responsive display sizes (`NN-320.jpg`, `NN-640.jpg`, `NN-960.jpg`, `NN-1600.jpg`) using ImageMagick,
3. emits `site.data.gallery`, which the templates render into the gallery grid.

Generated derivatives are git-ignored and regenerated on every build.

## Prerequisites

- **Ruby** 3.2+ (3.0 works too)
- **Bundler**
- **ImageMagick** (`magick` or `convert` / `identify`) — required to generate thumbnails

## Environment setup

```bash
# 1. Install Ruby (e.g. via rbenv, rvm, or your OS package manager)
#    Ubuntu/Debian: sudo apt-get install ruby-full ruby-dev build-essential
#    macOS (Homebrew): brew install ruby

# 2. Install Bundler
gem install bundler

# 3. Install ImageMagick
#    Ubuntu/Debian: sudo apt-get install imagemagick
#    macOS (Homebrew): brew install imagemagick

# 4. Install project dependencies
bundle install
```

The `_plugins/gallery_generator.rb` plugin auto-detects `magick` (ImageMagick 7) or `convert`/`identify` (ImageMagick 6), so either version works.

## Build & preview locally

Build the site into `_site/`:

```bash
bundle exec jekyll build
```

Serve it locally with live reload:

```bash
# strip the baseurl so the site works at http://localhost:4000/
bundle exec jekyll serve --baseurl ''
```

The `baseurl` is set to `/aspekt` in `_config.yml` for GitHub Pages (project site). Use `--baseurl ''` locally so URLs resolve correctly against `localhost`.

> Note: building requires ImageMagick (for thumbnails) and, on the first run, generates derivative images into `assets/photo-gallery/` (these are git-ignored).

## Adding photos

To add a new photo to a gallery:

1. Copy the image into the relevant folder: `assets/photo-gallery/<folder>/`.
2. Name it with the next zero-padded sequence number, e.g. `salon/29.jpg`.
3. Commit and push (for deployment) or just rebuild locally.

That's it — thumbnails and responsive sizes are generated automatically. Photos are ordered by filename, so renumber to reorder.

To add a new gallery folder:

1. Create `assets/photo-gallery/<new-folder>/` and drop in `NN.jpg` files.
2. Add the folder to the `galleries` list in `_config.yml` (id + PL/EN titles).

## Configuration

- `_config.yml` — site title, `baseurl`, the ordered list of gallery folders (`id`, `title.pl`, `title.en`), and `pricing` (the fee amounts — single source of truth for rent/service charge/deposit).
- `_data/i18n.yml` — all Polish/English copy (offer text, navigation, gallery labels). Keep the `pl` and `en` structures symmetric.
- `assets/css/main.css` — styles (baleon-inspired, responsive).
- `assets/js/main.js` — language toggle.
- `assets/js/gallery.js` — gallery tabs, lightbox, slideshow loop.

## Deployment to GitHub Pages

Deployment uses **GitHub Actions** (not the classic "Deploy from a branch" mode), because the thumbnail generator is a custom Jekyll plugin, which classic Pages (safe mode) does not allow.

### One-time setup

1. Push the repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.

(Alternatively, the workflow includes `enablement: true`, which attempts to enable Pages automatically on the first run.)

### Ongoing

Every push to `main` triggers `.github/workflows/pages.yml`, which:

1. checks out the repo,
2. sets up Ruby and runs `bundle install`,
3. installs ImageMagick,
4. runs `bundle exec jekyll build` (generates thumbnails and `site.data.gallery`),
5. uploads `_site/` and deploys to GitHub Pages.

The site is published at `https://<username>.github.io/aspekt/`.

### Custom domain (optional)

To serve from a custom domain instead of `<username>.github.io/aspekt/`:

1. Add a `CNAME` file with your domain to the repo root.
2. Configure the DNS as described in GitHub's docs.
3. Change `baseurl` in `_config.yml` to `""`.

## Project structure

```
aspekt/
├── _config.yml                 # site config, baseurl, galleries list
├── Gemfile                     # Jekyll dependency
├── _data/i18n.yml              # PL/EN strings
├── _plugins/gallery_generator.rb  # build-time photo discovery + thumbnail generation
├── _layouts/                   # default.html, home.html
├── _includes/gallery.html      # gallery grid partial
├── index.html                  # landing page
├── gallery.html                # gallery page (directory mode)
├── 404.html
├── assets/
│   ├── css/main.css
│   ├── js/main.js              # language toggle
│   ├── js/gallery.js           # gallery + lightbox
│   └── photo-gallery/          # photos (NN.jpg per folder)
├── .github/workflows/pages.yml # deploy workflow
└── SPECIFICATION.md            # full project specification
```
