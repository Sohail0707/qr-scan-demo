/* Scan page: language choice, in-app browser handling, and private location sharing. */
(function () {
  'use strict';
  const { PRODUCTS, toast, startNetworkLog } = window.DEMO;
  const $ = (id) => document.getElementById(id);

  /* ---------- text (two languages to show the selection order) ---------- */

  const STRINGS = {
    en: {
      language: 'Language', youScanned: 'You scanned', testCode: 'Test code',
      shareTitle: 'Share my location',
      shareIntro: 'Send where you are to someone you trust. It goes straight from your phone to your messaging app.',
      sms: 'Text message', copy: 'Copy link',
      inAppTitle: "You're in another app's browser.",
      inAppText: "Location is often blocked here. Open this page in your phone's browser.",
      openChrome: 'Open in Chrome', copyPage: 'Copy page link',
      iosHint: 'On iPhone, tap the ••• or share icon, then "Open in Safari".',
      locating: 'Finding your location…',
      retrying: 'GPS is slow here, trying network location…',
      found: 'Found you, accurate to about {m} m.',
      rough: 'Found you, but only to about {m} m. Add a landmark to your message.',
      message: 'I need help. This is where I am: {map}',
      copied: 'Link copied', copyFailed: 'Could not copy. Here is the link: {text}',
      denied: 'Location is blocked for this page. iPhone: Settings > Privacy & Security > Location Services > your browser > While Using. Android: tap the icon left of the address > Permissions > Location > Allow.',
      deniedEarly: 'Location is currently blocked for this page. You can still use the buttons; your phone will explain how to allow it.',
      unavailable: 'We could not find your location. Move near a window or outside and try again.',
      unsupported: 'This browser cannot share location. In WhatsApp, use Attach > Location instead.',
      fromQr: 'opened from a QR code', fromWeb: 'opened from the website'
    },
    nl: {
      language: 'Taal', youScanned: 'Je hebt gescand', testCode: 'Testcode',
      shareTitle: 'Mijn locatie delen',
      shareIntro: 'Stuur waar je bent naar iemand die je vertrouwt. Het gaat rechtstreeks van je telefoon naar je berichtenapp.',
      sms: 'Sms', copy: 'Link kopiëren',
      inAppTitle: 'Je zit in de browser van een andere app.',
      inAppText: 'Locatie is hier vaak geblokkeerd. Open deze pagina in de browser van je telefoon.',
      openChrome: 'Openen in Chrome', copyPage: 'Paginalink kopiëren',
      iosHint: 'Op iPhone: tik op ••• of het deel-icoon en kies "Open in Safari".',
      locating: 'Locatie zoeken…',
      retrying: 'GPS is hier traag, we proberen netwerklocatie…',
      found: 'Gevonden, nauwkeurig tot ongeveer {m} m.',
      rough: 'Gevonden, maar alleen tot ongeveer {m} m. Noem een herkenningspunt in je bericht.',
      message: 'Ik heb hulp nodig. Hier ben ik: {map}',
      copied: 'Link gekopieerd', copyFailed: 'Kopiëren mislukt. Dit is de link: {text}',
      denied: 'Locatie is geblokkeerd voor deze pagina. iPhone: Instellingen > Privacy en beveiliging > Locatievoorzieningen > je browser > Bij gebruik. Android: tik op het icoon links van het adres > Rechten > Locatie > Toestaan.',
      deniedEarly: 'Locatie is nu geblokkeerd voor deze pagina. Je kunt de knoppen toch gebruiken; je telefoon legt uit hoe je het toestaat.',
      unavailable: 'We konden je locatie niet vinden. Ga bij een raam of naar buiten en probeer opnieuw.',
      unsupported: 'Deze browser kan geen locatie delen. Gebruik in WhatsApp Bijlage > Locatie.',
      fromQr: 'geopend via een QR-code', fromWeb: 'geopend via de website'
    }
  };
  const NAMES = { en: 'English', nl: 'Nederlands' };
  const SUPPORTED = Object.keys(STRINGS);

  /** Order: ?lang= in the address > saved choice > phone language > English. */
  function pickLanguage() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    if (SUPPORTED.includes(fromUrl)) return [fromUrl, 'address (?lang=)'];
    let saved = null;
    try { saved = localStorage.getItem('demo_lang'); } catch (e) { /* private mode */ }
    if (SUPPORTED.includes(saved)) return [saved, 'your earlier choice'];
    const phone = (navigator.languages || [navigator.language || ''])
      .map((l) => String(l).slice(0, 2).toLowerCase())
      .find((l) => SUPPORTED.includes(l));
    if (phone) return [phone, 'phone language setting'];
    return ['en', 'fallback'];
  }

  let [lang, langSource] = pickLanguage();
  const t = (key, vars) => {
    let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
    return s;
  };

  /* ---------- product ---------- */

  const slug = (location.pathname.match(/\/scan\/([a-z0-9-]+)\/?$/i) || [])[1] ||
    new URLSearchParams(location.search).get('p');
  const product = PRODUCTS.find((p) => p.slug === String(slug || '').toLowerCase());
  if (!product) { location.replace('/?missing=1'); return; }
  const source = new URLSearchParams(location.search).get('src') === 'qr' ? 'qr' : 'web';

  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    document.title = `${product.name} | QR Scan Demo`;
    document.documentElement.style.setProperty('--accent', product.accent);
    $('product').textContent = product.name;
    $('code').textContent = product.code;
    $('source').textContent = t(source === 'qr' ? 'fromQr' : 'fromWeb');
    $('d-lang').textContent = NAMES[lang];
    $('d-lang-src').textContent = langSource;
  }

  const select = $('lang');
  SUPPORTED.forEach((code) => {
    const o = document.createElement('option');
    o.value = code; o.textContent = NAMES[code]; o.lang = code;
    select.appendChild(o);
  });
  select.value = lang;
  select.addEventListener('change', () => {
    lang = select.value; langSource = 'your choice (saved on this phone)';
    try { localStorage.setItem('demo_lang', lang); } catch (e) { /* ignore */ }
    render();
  });

  /* ---------- in-app browser detection ---------- */

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  // Heuristics: social/QR apps add their own markers; Android WebViews add "; wv)";
  // iOS in-app views usually lack the "Safari/" token that real browsers send.
  const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|MicroMessenger|musical_ly|Bytedance|TikTok/i.test(ua) ||
    (isAndroid && /; wv\)/.test(ua)) ||
    (isIOS && !/Safari\//.test(ua));

  $('d-browser').textContent = inApp ? 'in-app browser (location may be blocked)' :
    (isIOS ? 'iPhone browser' : isAndroid ? 'Android browser' : 'desktop browser');

  if (inApp) {
    $('inapp').hidden = false;
    if (isAndroid) {
      const a = $('open-browser');
      a.hidden = false;
      // Android intent link: reopens this exact page in Chrome.
      a.href = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;
    }
    if (isIOS) $('ios-hint').hidden = false;
  }
  $('copy-page').addEventListener('click', () => copyText(location.href).then(() => toast(t('copied'))));

  /* ---------- location ---------- */

  const status = (msg, kind) => { const el = $('status'); el.textContent = msg || ''; el.className = 'status' + (kind ? ' ' + kind : ''); };
  const busy = (on) => document.querySelectorAll('[data-share]').forEach((b) => { b.disabled = on; b.setAttribute('aria-busy', String(on)); });

  const getPosition = (opts) => new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, opts));

  /** GPS first; if it times out or can't get a fix (common indoors), fall back to network location. */
  async function locate() {
    try {
      const pos = await getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
      return { pos, method: 'GPS (high accuracy)' };
    } catch (err) {
      if (err.code === 1) throw err; // permission denied: retrying won't help
      status(t('retrying'), 'warn');
      const pos = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 });
      return { pos, method: 'network location (fallback)' };
    }
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', '');
    area.className = 'sr-only';
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy'); area.remove();
    if (!ok) throw new Error('copy failed');
  }

  function deliver(channel, text) {
    if (channel === 'whatsapp') {
      location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    } else if (channel === 'sms') {
      // iOS reads the body after "&", Android after "?".
      location.href = `sms:${isIOS ? '&' : '?'}body=${encodeURIComponent(text)}`;
    } else {
      copyText(text).then(() => toast(t('copied')))
        .catch(() => status(t('copyFailed', { text }), 'bad'));
    }
  }

  async function share(channel) {
    if (!('geolocation' in navigator)) { status(t('unsupported'), 'bad'); return; }
    busy(true); status(t('locating'));
    try {
      const { pos, method } = await locate();
      const { latitude, longitude, accuracy } = pos.coords;
      const m = Math.round(accuracy);
      const map = `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
      $('d-method').textContent = method;
      $('d-acc').textContent = `about ${m} m`;
      status(t(m > 500 ? 'rough' : 'found', { m }), m > 500 ? 'warn' : 'ok');
      deliver(channel, t('message', { map }));
    } catch (err) {
      status(t(err && err.code === 1 ? 'denied' : 'unavailable'), 'bad');
    } finally {
      busy(false);
    }
  }

  document.querySelectorAll('[data-share]').forEach((b) =>
    b.addEventListener('click', () => share(b.dataset.share)));

  // If location is already blocked, say so before the person taps anything.
  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'geolocation' })
      .then((p) => { if (p.state === 'denied') status(t('deniedEarly'), 'warn'); })
      .catch(() => { /* not supported on some browsers */ });
  }

  render();
  startNetworkLog($('netlog'));
})();
