import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = new URL('./check-i18n.mjs', import.meta.url).pathname;

function setupFixture({ html, en, th }) {
  const root = mkdtempSync(join(tmpdir(), 'i18n-check-'));
  mkdirSync(join(root, 'i18n'));
  writeFileSync(join(root, 'index.html'), html);
  writeFileSync(join(root, 'i18n', 'en.json'), JSON.stringify(en));
  writeFileSync(join(root, 'i18n', 'th.json'), JSON.stringify(th));
  return root;
}

function run(root) {
  return spawnSync('node', [SCRIPT, '--root', root], { encoding: 'utf8' });
}

test('check-i18n: exits 0 when HTML keys match en.json and th.json keysets', (t) => {
  const root = setupFixture({
    html: '<h1 data-i18n="hero.title">x</h1>',
    en: { 'hero.title': 'Hello' },
    th: { 'hero.title': 'สวัสดี' },
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
});

test('check-i18n: exits 1 + reports orphan when HTML has data-i18n key not in en.json', (t) => {
  const root = setupFixture({
    html: '<h1 data-i18n="hero.title">x</h1><p data-i18n="hero.ghost">y</p>',
    en: { 'hero.title': 'Hello' },
    th: { 'hero.title': 'สวัสดี' },
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HTML uses data-i18n="hero\.ghost" but key not in en\.json/);
});

test('check-i18n: exits 1 + reports missing key when th.json lacks a key en.json has', (t) => {
  const root = setupFixture({
    html: '<h1 data-i18n="hero.title">x</h1><p data-i18n="hero.intro">y</p>',
    en: { 'hero.title': 'Hello', 'hero.intro': 'Intro' },
    th: { 'hero.title': 'สวัสดี' },
  });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /th\.json missing key "hero\.intro"/);
});
