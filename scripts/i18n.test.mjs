import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveLocale,
  applyTranslations,
  extractKeysFromHtml,
  nativeLabel,
  pickerOptionsFor,
  selectLocale,
} from '../assets/i18n.mjs';

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

test('nativeLabel: returns the native-language name for a known locale', () => {
  assert.equal(nativeLabel('en'), 'English');
});

test('nativeLabel: falls back to the locale code for an unknown locale', () => {
  assert.equal(nativeLabel('xx'), 'xx');
});

test('pickerOptionsFor: returns one option per supported locale, preserving order, with native labels', () => {
  assert.deepEqual(pickerOptionsFor(['en', 'th']), [
    { value: 'en', label: 'English' },
    { value: 'th', label: 'ไทย' },
  ]);
});

function makeSelectLocaleDeps() {
  const stored = {};
  const historyCalls = [];
  const setLocaleCalls = [];
  return {
    stored,
    historyCalls,
    setLocaleCalls,
    deps: {
      url: 'https://example.com/?other=keep',
      storage: {
        getItem: (k) => stored[k] ?? null,
        setItem: (k, v) => {
          stored[k] = v;
        },
      },
      history: {
        replaceState: (state, title, url) => historyCalls.push({ state, title, url }),
      },
      setLocaleFn: (locale) => {
        setLocaleCalls.push(locale);
      },
    },
  };
}

test('selectLocale: persists the chosen locale to storage under "locale"', () => {
  const { stored, deps } = makeSelectLocaleDeps();
  selectLocale('th', deps);
  assert.equal(stored.locale, 'th');
});

test('selectLocale: replaces the current URL with one carrying ?lang=<locale>, preserving other params', () => {
  const { historyCalls, deps } = makeSelectLocaleDeps();
  selectLocale('th', deps);
  assert.equal(historyCalls.length, 1);
  const replaced = new URL(historyCalls[0].url, deps.url);
  assert.equal(replaced.searchParams.get('lang'), 'th');
  assert.equal(replaced.searchParams.get('other'), 'keep');
});

test('selectLocale: triggers the page swap by calling setLocaleFn with the chosen locale', () => {
  const { setLocaleCalls, deps } = makeSelectLocaleDeps();
  selectLocale('th', deps);
  assert.deepEqual(setLocaleCalls, ['th']);
});

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
