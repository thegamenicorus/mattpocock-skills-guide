# Context

Glossary of domain terms for this repo. Update as terms are resolved.

## Terms

### Locale

A language-region identifier the page can be rendered in. Currently: `en` (English, default, source-of-truth in HTML) and `th` (Thai). Selected via `?lang=<locale>` URL param, persisted in `localStorage`, falls back to `navigator.language` on first visit.

### Translation key

A dotted string (e.g. `hero.title`) attached to a DOM node via `data-i18n="<key>"`. JS reads the active locale's JSON map and replaces the node's `textContent` with `map[key]`. Flat keys, no nesting.

### Fallback locale

When the active locale's JSON is missing a key, the node is left untouched — its inline HTML text (English) is the fallback. In `?debug=1` mode, missing keys render as `[MISSING:<locale>:<key>]` for translator-facing gap detection.

### Skill name

A Claude Code slash command like `/grill-with-docs` or `/tdd`. Skill names are **never** translated — they're CLI identifiers. No `data-i18n` on them.

### Prompt template

The English text inside `<pre id="*-prompt">` and `<pre id="*-template">` blocks that users copy-paste into Claude Code. **Never translated** — skills are English-defined and respond best to English prompts. A translated caption above each block explains why the template stays English.
