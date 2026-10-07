/* Shared helpers: product list, toast, and a live network log. */
(function () {
  'use strict';

  const PRODUCTS = [
    { code: 'TA', slug: 'test-a', name: 'Demo Test A', accent: '#3DD6C6' },
    { code: 'TB', slug: 'test-b', name: 'Demo Test B', accent: '#F5A524' }
  ];

  let toastTimer;
  function toast(message) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /**
   * Lists every request the page has made, using the browser's own
   * Performance API. New requests after load are highlighted, so you can
   * press "Share" and watch that nothing new appears.
   */
  function startNetworkLog(listEl) {
    if (!listEl || !('PerformanceObserver' in window)) return;
    let loaded = false;
    window.addEventListener('load', () => setTimeout(() => { loaded = true; }, 500));

    function add(entry) {
      const url = new URL(entry.name, location.href);
      const li = document.createElement('li');
      if (loaded) li.className = 'new';
      const path = document.createElement('span');
      path.className = 'mono';
      path.textContent = url.pathname.split('/').pop() || url.pathname;
      const host = document.createElement('span');
      host.className = 'host mono';
      host.textContent = url.host === location.host ? 'this site' : url.host;
      li.append(path, host);
      listEl.appendChild(li);
    }

    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) add(nav);
    new PerformanceObserver((list) => list.getEntries().forEach(add))
      .observe({ type: 'resource', buffered: true });
  }

  window.DEMO = Object.freeze({ PRODUCTS, toast, startNetworkLog });
})();
