export function extractKeysFromHtml(htmlString) {
  const keys = new Set();
  const re = /\bdata-i18n\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(htmlString)) !== null) keys.add(m[1]);
  return keys;
}

export function applyTranslations(root, map, { debug = false, locale = '' } = {}) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    const key = node.getAttribute('data-i18n');
    if (key in map) {
      node.textContent = map[key];
    } else if (debug) {
      node.textContent = `[MISSING:${locale}:${key}]`;
    }
  }
}

export function resolveLocale({ url, storage, nav, supported }) {
  const param = new URL(url).searchParams.get('lang');
  if (param && supported.includes(param)) return param;
  const stored = storage.getItem('locale');
  if (stored && supported.includes(stored)) return stored;
  const navLang = (nav.language || '').split('-')[0].toLowerCase();
  if (navLang && supported.includes(navLang)) return navLang;
  return supported[0];
}

export const SUPPORTED = ['en', 'th'];

export async function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) locale = SUPPORTED[0];
  const debug = new URL(location.href).searchParams.get('debug') === '1';
  if (locale !== SUPPORTED[0]) {
    const res = await fetch(`i18n/${locale}.json`, { cache: 'no-cache' });
    const map = await res.json();
    applyTranslations(document, map, { debug, locale });
    if (map['title.text']) document.title = map['title.text'];
  }
  document.documentElement.lang = locale;
  document.documentElement.classList.remove('i18n-loading-root');
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.__i18n = { resolveLocale, applyTranslations, extractKeysFromHtml, setLocale, SUPPORTED };
  const locale = resolveLocale({
    url: location.href,
    storage: window.localStorage,
    nav: navigator,
    supported: SUPPORTED,
  });
  setLocale(locale).catch((err) => {
    console.error('[i18n] failed to apply locale', err);
    document.documentElement.classList.remove('i18n-loading-root');
  });
}
