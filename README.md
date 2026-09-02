# Matt Pocock Skills: Daily Developer Guide

A bilingual single-page guide explaining how to put Matt Pocock's agent skills to work in everyday development — installation, use-case recipes, copyable prompts, simulated sessions, caveats, and a complete stable-skill reference.

Guide content is synced to [`mattpocock/skills@6654f6b`](https://github.com/mattpocock/skills/commit/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76) (2026-08-24). Experimental `skills/in-progress/` entries are intentionally excluded.

## Live site

Published via GitHub Pages: https://thegamenicorus.github.io/mattpocock-skills-guide/

## Contents

- `index.html` — the entire guide (HTML + inline CSS, no build step)
- `assets/i18n.mjs` — runtime locale-swap module loaded by `index.html`
- `i18n/` — one JSON file per locale (`en.json`, `th.json`, …)
- `scripts/` — zero-dep Node scripts (`check-i18n.mjs` parity check + `*.test.mjs` suites)
- `CONTEXT.md` — domain glossary
- `docs/adr/` — architecture decision records

## Local preview

Just open the file in a browser:

```sh
open index.html
```

English renders fine over `file://`. The language picker is hidden in that mode because the i18n runtime can't load modules or fetch JSON from the filesystem. To preview a non-default locale, serve over HTTP:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000          (English)
# or       http://localhost:8000/?lang=th   (Thai)
```

## Translations

Translations are JSON files keyed by `data-i18n` attributes in `index.html`. The architecture is documented in [`CONTEXT.md`](CONTEXT.md) and [`docs/adr/0001-runtime-json-i18n.md`](docs/adr/0001-runtime-json-i18n.md). To add a new locale (worked example: French / `fr`):

1. **Register the locale.** Append `'fr'` to the `SUPPORTED` array at the top of [`assets/i18n.mjs`](assets/i18n.mjs).
2. **Add its native name.** Add `fr: 'Français'` to the `NATIVE_LABELS` map in the same file. The `<select>` picker is populated from `SUPPORTED` + these labels, so no HTML edit is needed.
3. **(Optional) Register a web font.** If French needs a non-default font, add an entry to `FONT_CONFIGS` with `{ family, href }`. Otherwise skip — `--sans` stays on the base stack.
4. **Translate the strings.** Copy `i18n/en.json` to `i18n/fr.json` and translate every value. Keys ending in `.html` carry inline markup (`<code>`, `<strong>`, etc.) — preserve the tags verbatim. Skill names inside `<code>` are CLI identifiers and **never** translate. Claude prompt-template `<pre>` blocks are not keyed and stay English.
5. **Verify parity.** Run `node scripts/check-i18n.mjs` — it exits non-zero if any `data-i18n` key in HTML is missing from a locale JSON, or vice versa.

## Tests

Zero-dep Node `--test` suite covers the pure i18n functions and the parity script:

```sh
node --test scripts/*.test.mjs   # 28+ tests, no install needed
node scripts/check-i18n.mjs      # cross-checks HTML markers against every JSON
```

Both run on a fresh `git clone` with no `npm install` — there is no `package.json` and there are no dependencies.

## Deploying

This repo is configured for GitHub Pages from the `main` branch root. Push to `main` and GitHub Pages will pick up the change automatically.
