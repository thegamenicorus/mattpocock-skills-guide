import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale, applyTranslations, extractKeysFromHtml } from '../assets/i18n.mjs';

function stubNode(key, text = '') {
  const node = {
    getAttribute: (n) => (n === 'data-i18n' ? key : null),
    textContent: text,
  };
  return node;
}

function stubRoot(nodes) {
  return { querySelectorAll: () => nodes };
}

test('applyTranslations: writes textContent for a tagged node when key is in map', () => {
  const node = stubNode('hero.title', 'Original English');
  applyTranslations(stubRoot([node]), { 'hero.title': 'หัวเรื่อง' });
  assert.equal(node.textContent, 'หัวเรื่อง');
});

test('applyTranslations: leaves textContent untouched when key missing (no debug)', () => {
  const node = stubNode('hero.title', 'Original English');
  applyTranslations(stubRoot([node]), {});
  assert.equal(node.textContent, 'Original English');
});

test('applyTranslations: debug mode writes [MISSING:<locale>:<key>] for missing keys', () => {
  const node = stubNode('hero.title', 'Original English');
  applyTranslations(stubRoot([node]), {}, { debug: true, locale: 'th' });
  assert.equal(node.textContent, '[MISSING:th:hero.title]');
});

test('extractKeysFromHtml: extracts a single data-i18n attribute value', () => {
  const keys = extractKeysFromHtml('<h1 data-i18n="hero.title">Hello</h1>');
  assert.deepEqual([...keys], ['hero.title']);
});

test('extractKeysFromHtml: extracts multiple keys deduped across the document', () => {
  const html = `
    <h1 data-i18n="hero.title">x</h1>
    <p data-i18n="hero.intro">y</p>
    <span data-i18n="hero.title">x again</span>
  `;
  const keys = extractKeysFromHtml(html);
  assert.deepEqual([...keys].sort(), ['hero.intro', 'hero.title']);
});

test('resolveLocale: ?lang=th in URL returns "th" when supported', () => {
  const locale = resolveLocale({
    url: 'https://example.com/?lang=th',
    storage: { getItem: () => null },
    nav: { language: 'en-US' },
    supported: ['en', 'th'],
  });
  assert.equal(locale, 'th');
});

test('resolveLocale: localStorage locale wins when URL has no ?lang param', () => {
  const locale = resolveLocale({
    url: 'https://example.com/',
    storage: { getItem: (k) => (k === 'locale' ? 'th' : null) },
    nav: { language: 'en-US' },
    supported: ['en', 'th'],
  });
  assert.equal(locale, 'th');
});

test('resolveLocale: navigator.language prefix matches when no URL or storage', () => {
  const locale = resolveLocale({
    url: 'https://example.com/',
    storage: { getItem: () => null },
    nav: { language: 'th-TH' },
    supported: ['en', 'th'],
  });
  assert.equal(locale, 'th');
});

test('resolveLocale: defaults to first supported locale when nothing matches', () => {
  const locale = resolveLocale({
    url: 'https://example.com/',
    storage: { getItem: () => null },
    nav: { language: 'fr-FR' },
    supported: ['en', 'th'],
  });
  assert.equal(locale, 'en');
});

test('resolveLocale: ?lang=xx with unsupported locale falls back to default "en"', () => {
  const locale = resolveLocale({
    url: 'https://example.com/?lang=xx',
    storage: { getItem: () => null },
    nav: { language: 'en-US' },
    supported: ['en', 'th'],
  });
  assert.equal(locale, 'en');
});
