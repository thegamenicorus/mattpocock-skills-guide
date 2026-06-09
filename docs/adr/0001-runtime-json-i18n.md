# ADR-0001: Runtime JSON i18n with no build step

**Status:** Accepted
**Date:** 2026-06-09

## Context

The guide is a single static `index.html` (~2400 lines) deployed via GitHub Pages from `main`. The README's defining feature is "no build step" — `open index.html` is the local preview. We need to add Thai (and later, more languages) without losing that property.

## Decision

Translations live in JSON files per locale (`i18n/en.json`, `i18n/th.json`). At runtime, a tiny vanilla-JS file (`assets/i18n.js`) reads `?lang=<locale>`, fetches the matching JSON, and swaps `textContent` on every node tagged with `data-i18n="<key>"`. English remains the source-of-truth inline in HTML and `en.json` mirrors it for translator parity + drift detection. The `<html lang>` and `<title>` are updated on locale change.

Body is hidden until the swap completes for non-default locales, to avoid an English flash.

## Alternatives considered

### Separate pre-rendered HTML per locale (`index.html`, `th.html`)

Rejected. Triplicates 2400 lines. Every CSS or copy edit becomes N edits. Drift is inevitable and silent.

### Build step (Eleventy / Astro / similar templating)

Rejected. Contradicts the repo's stated "no build step" rule. Adds Node toolchain, package manifest, and CI complexity to a one-file site. Reverses cheaply if we ever outgrow runtime i18n.

### Auto-detect language only, no UI picker

Rejected. `navigator.language` is unreliable and gives the user no way to override.

## Consequences

- English visitors pay zero cost: no JS fetch, no JSON download, no flash.
- Non-English visitors pay one small JSON fetch + a brief hidden-body window.
- SEO sees only English. Acceptable for a developer-tools guide; not acceptable if this ever becomes a marketing surface.
- Drift between HTML (English source) and `en.json` (English mirror) must be guarded with a tiny check script (`scripts/check-i18n.mjs`) — runnable locally, CI-able later.
- Skill names and code blocks are never tagged with `data-i18n`. Prompt templates stay English and get a translated caption above them.
- Adding a new locale = add `i18n/<locale>.json` + add an `<option>` to the picker. Architecture is N-language-ready from day one even though only Thai ships first.
