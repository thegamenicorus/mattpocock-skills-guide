export function extractKeysFromHtml(htmlString) {
  const keys = new Set();
  const re = /\bdata-i18n\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(htmlString)) !== null) keys.add(m[1]);
  return keys;
}

export function captureDefaultMap(root) {
  const map = {};
  for (const node of root.querySelectorAll('[data-i18n]')) {
    const key = node.getAttribute('data-i18n');
    map[key] = key.endsWith('.html') ? node.innerHTML : node.textContent;
  }
  return map;
}

export function applyTranslations(root, map, { debug = false, locale = '' } = {}) {
  for (const node of root.querySelectorAll('[data-i18n]')) {
    const key = node.getAttribute('data-i18n');
    if (key in map) {
      if (key.endsWith('.html')) {
        node.innerHTML = map[key];
      } else {
        node.textContent = map[key];
      }
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

const NATIVE_LABELS = { en: 'English', th: 'ไทย' };

const FONT_CONFIGS = {
  th: {
    family: 'Noto Sans Thai',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap',
  },
};

export function fontConfigFor(locale) {
  return FONT_CONFIGS[locale] || null;
}

const BASE_SANS = '"Avenir Next", "Segoe UI", sans-serif';

export function installFontFor(locale, doc) {
  const cfg = fontConfigFor(locale);
  if (!cfg) return;
  const id = `i18n-font-${locale}`;
  if (!doc.getElementById(id)) {
    const link = doc.createElement('link');
    link.id = id;
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', cfg.href);
    doc.head.appendChild(link);
  }
  // Always re-apply --sans, even when the <link> is already present:
  // switching to the default locale resets --sans to the base stack, so
  // switching back must re-prefix the locale font or text falls back.
  doc.documentElement.style.setProperty('--sans', `"${cfg.family}", ${BASE_SANS}`);
}

export function nativeLabel(locale) {
  return NATIVE_LABELS[locale] || locale;
}

export function pickerOptionsFor(supported) {
  return supported.map((value) => ({ value, label: nativeLabel(value) }));
}

export function selectLocale(locale, deps) {
  if (!deps) {
    deps = {
      url: location.href,
      storage: window.localStorage,
      history: window.history,
      setLocaleFn: setLocale,
    };
  }
  deps.storage.setItem('locale', locale);
  const next = new URL(deps.url);
  next.searchParams.set('lang', locale);
  deps.history.replaceState({}, '', next.pathname + next.search + next.hash);
  deps.setLocaleFn(locale);
}

let defaultMap = null;

async function awaitFontReady(locale) {
  const cfg = fontConfigFor(locale);
  if (!cfg || !document.fonts || !document.fonts.load) return;
  try {
    await document.fonts.load(`1rem "${cfg.family}"`);
  } catch {
    // Network or CORS failure on the font — fall through; text will show in
    // the fallback stack, which is the same outcome we'd get without await.
  }
}

export async function setLocale(locale) {
  if (!SUPPORTED.includes(locale)) locale = SUPPORTED[0];
  if (defaultMap === null) defaultMap = captureDefaultMap(document);
  const debug = new URL(location.href).searchParams.get('debug') === '1';
  installFontFor(locale, document);
  if (!fontConfigFor(locale)) {
    document.documentElement.style.setProperty('--sans', BASE_SANS);
  }
  const [map] = await Promise.all([
    locale === SUPPORTED[0]
      ? Promise.resolve(defaultMap)
      : fetch(`i18n/${locale}.json`, { cache: 'no-cache' }).then((r) => r.json()),
    awaitFontReady(locale),
  ]);
  applyTranslations(document, map, { debug, locale });
  if (map['title.text']) document.title = map['title.text'];
  document.documentElement.lang = locale;
  document.documentElement.classList.remove('i18n-loading-root');
}

function mountLanguagePicker(activeLocale) {
  const picker = document.getElementById('lang-picker');
  if (!picker) return;
  for (const opt of pickerOptionsFor(SUPPORTED)) {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    if (opt.value === activeLocale) el.selected = true;
    picker.appendChild(el);
  }
  picker.addEventListener('change', (e) => selectLocale(e.target.value));
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.__i18n = {
    resolveLocale,
    applyTranslations,
    extractKeysFromHtml,
    setLocale,
    selectLocale,
    nativeLabel,
    pickerOptionsFor,
    fontConfigFor,
    installFontFor,
    SUPPORTED,
  };
  const locale = resolveLocale({
    url: location.href,
    storage: window.localStorage,
    nav: navigator,
    supported: SUPPORTED,
  });
  mountLanguagePicker(locale);
  setLocale(locale).catch((err) => {
    console.error('[i18n] failed to apply locale', err);
    document.documentElement.classList.remove('i18n-loading-root');
  });
}
