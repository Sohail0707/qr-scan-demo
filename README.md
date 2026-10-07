# QR Scan Demo

A small Netlify demo of the three hard parts of a QR scan page:

1. **Permanent QR codes**: short `/q/CODE` addresses with 302 redirects (`_redirects`), lowercase support, unknown codes sent to the hub, vector SVG QR codes at error correction Q.
2. **Private location sharing**: coordinates stay in the browser and go only into a WhatsApp or SMS link. `_headers` sets `connect-src 'self'` and `form-action 'none'`, so the page cannot send data to any other server. A live network log (browser Performance API) shows every request the page makes.
3. **Location that works indoors**: GPS first (8 s), then network location as a fallback, with accuracy shown. Detects in-app browsers (Instagram, Facebook, Android WebView, iOS in-app views) and offers "Open in Chrome" or "Open in Safari" help.

It also shows the language choice order (`?lang=` > saved choice > phone language > English) in English and Dutch, and a 404 page using absolute asset paths.

## Deploy (2 minutes)

1. Go to app.netlify.com → Add new site → Deploy manually.
2. Drag this whole folder in. `_redirects` and `_headers` must stay at the top level.
3. Optional: Site settings → change the site name, e.g. `qr-scan-demo-sohail`.

Redirects and headers only work on Netlify, not when opening the files locally.

## Files

- `_redirects`: the QR redirect table (readable by a non-developer)
- `_headers`: security headers and noindex for scan pages
- `index.html` + `assets/home.js`: hub, QR codes, explanations
- `scan.html` + `assets/scan.js`: scan page, language, location
- `assets/common.js`: products, toast, network log
- `assets/qrcode.js`: QR library (qrcode-generator, MIT)
- `404.html`: not-found page
