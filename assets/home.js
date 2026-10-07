/* Hub page: draws a vector QR code per product for this site's own address. */
(function () {
  'use strict';
  const { PRODUCTS, startNetworkLog } = window.DEMO;

  if (new URLSearchParams(location.search).get('missing')) {
    document.getElementById('missing').hidden = false;
  }

  /** Builds a clean SVG from the QR matrix: one path, no inline styles, 4-module margin. */
  function qrSvg(text) {
    const qr = qrcode(0, 'Q'); // 0 = smallest version that fits, Q = ~25% damage tolerance
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const margin = 4;
    const size = count + margin * 2;
    let d = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) d += `M${c + margin},${r + margin}h1v1h-1z`;
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">` +
      `<rect width="${size}" height="${size}" fill="#ffffff"/><path d="${d}" fill="#000000"/></svg>`;
    return { svg, version: (count - 17) / 4, modules: count };
  }

  const grid = document.getElementById('qr-grid');
  PRODUCTS.forEach((p) => {
    const url = `${location.origin}/q/${p.code}`;
    const { svg, version, modules } = qrSvg(url);

    const card = document.createElement('div');
    card.className = 'qr-card';
    const holder = document.createElement('div');
    holder.innerHTML = svg; // generated locally from the matrix above, not from user input

    const name = document.createElement('strong');
    name.textContent = p.name;
    const addr = document.createElement('div');
    addr.className = 'mono small';
    addr.textContent = url;
    const meta = document.createElement('div');
    meta.className = 'small';
    meta.textContent = `Version ${version} · ${modules}×${modules} · level Q`;

    const dl = document.createElement('a');
    dl.className = 'btn';
    dl.textContent = 'Download SVG';
    dl.download = `qr-${p.code}.svg`;
    dl.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));

    card.append(holder, name, addr, meta, dl);
    grid.appendChild(card);
  });

  startNetworkLog(document.getElementById('netlog'));
})();
