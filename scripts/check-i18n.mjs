#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractKeysFromHtml } from '../assets/i18n.mjs';

function parseArgs(argv) {
  const args = { root: '.' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = argv[++i];
  }
  return args;
}

function main(argv) {
  const { root } = parseArgs(argv);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const htmlKeys = extractKeysFromHtml(html);

  const i18nDir = join(root, 'i18n');
  const locales = {};
  for (const file of readdirSync(i18nDir)) {
    if (!file.endsWith('.json')) continue;
    const locale = file.replace(/\.json$/, '');
    locales[locale] = new Set(Object.keys(JSON.parse(readFileSync(join(i18nDir, file), 'utf8'))));
  }

  const problems = [];
  const enKeys = locales.en;
  if (!enKeys) problems.push('Missing i18n/en.json');

  if (enKeys) {
    for (const key of htmlKeys) {
      if (!enKeys.has(key)) problems.push(`HTML uses data-i18n="${key}" but key not in en.json`);
    }
    for (const key of enKeys) {
      if (!htmlKeys.has(key)) problems.push(`en.json has key "${key}" with no data-i18n marker in HTML`);
    }
    for (const [locale, keys] of Object.entries(locales)) {
      if (locale === 'en') continue;
      for (const key of enKeys) {
        if (!keys.has(key)) problems.push(`${locale}.json missing key "${key}" (present in en.json)`);
      }
      for (const key of keys) {
        if (!enKeys.has(key)) problems.push(`${locale}.json has extra key "${key}" not in en.json`);
      }
    }
  }

  if (problems.length) {
    for (const p of problems) process.stderr.write(p + '\n');
    process.exit(1);
  }
  process.exit(0);
}

main(process.argv.slice(2));
