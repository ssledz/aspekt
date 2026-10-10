# AGENTS.md

Guidance for AI coding agents working on this Jekyll apartment-rental site. Keep rules here high-signal: only what would otherwise cause a mistake.

## Project at a glance

Jekyll static site → GitHub Pages (project site, served at `/aspekt/`). The photo gallery is driven by a custom generator plugin that auto-discovers photos and builds thumbnails at build time. Templates read `site.data.gallery` (emitted by the plugin), not `site.static_files`.

## Commands

```bash
bundle install                            # install deps
bundle exec jekyll build                  # build into _site/
bundle exec jekyll serve --baseurl ''     # local preview (strip baseurl)
```

There is no test or lint suite — `jekyll build` is the verification. Building requires ImageMagick (`magick` or `convert`/`identify`); the plugin auto-detects either.

## Non-obvious rules

- **Deploy via GitHub Actions only.** The thumbnail generator is a custom `.rb` plugin; classic "Deploy from a branch" Pages (safe mode) forbids custom plugins. Never switch `Settings → Pages` back to branch-based deploys.
- **Photo naming is strict.** Originals must be `assets/photo-gallery/<folder>/NN.jpg` (zero-padded digits + `.jpg`/`.jpeg`). The generator only matches `\A\d+\.(jpe?g)\z` — any other name is silently ignored.
- **Derivatives are generated, never committed.** `NN-th.jpg`, `NN-320.jpg`, … are produced at build time and git-ignored. Do not `git add` them and do not reference them as if they exist in source.
- **Gallery folders must be registered.** A new folder under `assets/photo-gallery/` also needs a matching entry in `_config.yml` → `galleries` (`id` + `title.pl`/`title.en`), or its photos won't render.
- **i18n trees must be symmetric.** `_data/i18n.yml` has `pl` and `en` with identical key paths — the `data-i18n` JS swap resolves by path. Add a string to one language without the other and the toggle breaks.
- **Use `relative_url` for asset URLs** (baseurl is `/aspekt`). The generator already prefixes `baseurl` into `srcset` strings; don't double-prefix.
- **Plain CSS only.** `assets/css/main.css` is plain CSS, not SCSS. Do not rename to `.scss` or introduce Sass — the project is intentionally frontend-dependency-free (GLightbox via CDN).

## Gotchas (past mistakes)

- Jekyll 4.4 site hooks are `:after_init, :after_reset, :post_read, :pre_render, :post_render, :post_write`. **There is no `:pre_read`.** The generator registers `:after_reset` so derivatives exist before `Site#read` collects them as static files.
- `jekyll serve` without `--baseurl ''` yields broken asset URLs locally (baseurl `/aspekt` gets prepended). Always pass `--baseurl ''` for local preview.
- Commits are GPG/SSH-signed via 1Password. A commit failing with a signing error means 1Password is locked — don't work around it with `--no-gpg-sign`; ask the user to unlock it.

## Boundaries

**Always do:**
- Follow `NN.jpg` naming + folder registration when adding photos.
- Keep `pl`/`en` i18n trees symmetric.
- Rebuild locally (`jekyll build`) to verify before committing.

**Ask first:**
- Changing `baseurl` or the deploy mechanism.
- Adding gems to the `Gemfile`.
- Altering the photo naming convention or the `site.data.gallery` data contract.

**Never do:**
- Commit generated image derivatives.
- Use branch-based GitHub Pages deploys.
- Introduce Sass/SCSS or a JS bundler.
