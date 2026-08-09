/* ========== ParcelPro - Search JavaScript ========== */

(function () {
  'use strict';

  window.ParcelProSearch = {
    open,
    close,
    init
  };

  const SEARCH_DATA = [
    { title: 'Track a Parcel', type: 'Feature', url: 'customer-dashboard/my-parcels.html', icon: 'bi-search' },
    { title: 'Shipment History', type: 'Customer', url: 'customer-dashboard/my-parcels.html', icon: 'bi-clock-history' },
    { title: 'Invoices', type: 'Customer', url: 'customer-dashboard/my-parcels.html', icon: 'bi-receipt' },
    { title: 'Address Book', type: 'Customer', url: 'customer-dashboard/profile.html', icon: 'bi-book' },
    { title: 'Support', type: 'Customer', url: 'customer-dashboard/settings.html', icon: 'bi-headset' },
    { title: 'Admin Dashboard', type: 'Admin', url: 'admin/dashboard.html', icon: 'bi-speedometer2' },
    { title: 'Customer Management', type: 'Admin', url: 'admin/customers.html', icon: 'bi-people' },
    { title: 'Orders', type: 'Admin', url: 'admin/orders.html', icon: 'bi-bag' },
    { title: 'Parcels', type: 'Admin', url: 'admin/parcels.html', icon: 'bi-box' },
    { title: 'Delivery Agents', type: 'Admin', url: 'admin/delivery-agents.html', icon: 'bi-truck' },
    { title: 'Warehouses', type: 'Admin', url: 'admin/warehouses.html', icon: 'bi-building' },
    { title: 'Reports', type: 'Admin', url: 'admin/reports.html', icon: 'bi-file-earmark-bar-graph' },
    { title: 'Analytics', type: 'Admin', url: 'admin/analytics.html', icon: 'bi-graph-up' },
    { title: 'Pricing', type: 'Page', url: 'pricing.html', icon: 'bi-tags' },
    { title: 'Services', type: 'Page', url: 'services.html', icon: 'bi-diagram-3' },
    { title: 'Domestic Shipping', type: 'Service', url: 'service-details.html?id=domestic', icon: 'bi-globe-americas' },
    { title: 'International Shipping', type: 'Service', url: 'service-details.html?id=international', icon: 'bi-globe' },
    { title: 'Same Day Delivery', type: 'Service', url: 'service-details.html?id=sameday', icon: 'bi-lightning' },
    { title: 'Express Delivery', type: 'Service', url: 'service-details.html?id=express', icon: 'bi-rocket' },
    { title: 'Warehousing', type: 'Service', url: 'service-details.html?id=warehouse', icon: 'bi-warehouse' },
    { title: 'Packaging', type: 'Service', url: 'service-details.html?id=packaging', icon: 'bi-box-seam' },
    { title: 'Freight Services', type: 'Service', url: 'service-details.html?id=freight', icon: 'bi-airplane' },
    { title: 'Pickup Service', type: 'Service', url: 'service-details.html?id=pickup', icon: 'bi-geo-alt' },
    { title: 'About Us', type: 'Page', url: 'about.html', icon: 'bi-info-circle' },
    { title: 'Blog', type: 'Page', url: 'blog.html', icon: 'bi-newspaper' },
    { title: 'Contact Us', type: 'Page', url: 'contact.html', icon: 'bi-envelope' },
    { title: 'FAQ', type: 'Page', url: 'faq.html', icon: 'bi-question-circle' },
    { title: 'Careers', type: 'Page', url: 'careers.html', icon: 'bi-briefcase' },
    { title: 'Testimonials', type: 'Page', url: 'testimonials.html', icon: 'bi-chat-quote' },
    { title: 'Login', type: 'Auth', url: 'login.html', icon: 'bi-box-arrow-in-right' },
    { title: 'Register', type: 'Auth', url: 'register.html', icon: 'bi-person-plus' }
  ];

  let overlay, input, results, recentContainer, noResults, isOpen = false;

  function init() {
    const toggle = document.querySelector('.search-toggle, [data-search-open]');
    if (!toggle && document.getElementById('globalSearchInput')) {
      // Already embedded on page
      setupEmbeddedSearch();
      return;
    }
    if (toggle) {
      toggle.addEventListener('click', open);
      createOverlay();
    }
    const embeddedInput = document.getElementById('globalSearchInput');
    if (embeddedInput) {
      embeddedInput.addEventListener('focus', open);
    }
  }

  function setupEmbeddedSearch() {
    const inputEl = document.getElementById('globalSearchInput');
    if (!inputEl) return;
    inputEl.addEventListener('input', (e) => {
      performSearch(e.target.value, document.getElementById('globalSearchResults'));
    });
  }

  function createOverlay() {
    if (document.getElementById('ppSearchOverlay')) return;
    overlay = document.createElement('div');
    overlay.id = 'ppSearchOverlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(6px);
      z-index: 9998; display: none; align-items: flex-start; justify-content: center;
      padding-top: 15vh;
    `;
    overlay.innerHTML = `
      <div class="search-modal" style="
        width: 90%; max-width: 720px; background: var(--white, #fff);
        border-radius: 20px; box-shadow: 0 30px 80px rgba(0,0,0,0.3);
        overflow: hidden; border: 1px solid var(--gray-200);
      ">
        <div style="display: flex; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--gray-200);">
          <i class="bi bi-search" style="font-size: 20px; color: var(--gray-500); margin-right: 12px;"></i>
          <input id="ppSearchInput" type="text" placeholder="Search for anything... (Press /)" autocomplete="off" style="
            flex: 1; border: none; outline: none; background: transparent; font-size: 17px;
            font-family: Inter; color: var(--gray-900);
          ">
          <kbd style="padding: 4px 10px; font-size: 11px; background: var(--gray-100); border-radius: 6px; color: var(--gray-600); font-family: monospace; margin-left: 8px;">ESC</kbd>
        </div>
        <div id="ppRecentContainer" style="padding: 16px 24px; display: block;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gray-500); letter-spacing: 1px; margin-bottom: 10px;">Recent Searches</div>
          <div id="ppRecentList" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
        </div>
        <div id="ppSearchResults" style="max-height: 50vh; overflow-y: auto; padding: 8px 0;"></div>
        <div id="ppNoResults" style="display: none; padding: 40px 24px; text-align: center;">
          <i class="bi bi-search-x" style="font-size: 40px; color: var(--gray-400);"></i>
          <div style="margin-top: 12px; font-weight: 600; color: var(--gray-700);">No results found</div>
          <div style="font-size: 13px; color: var(--gray-500);">Try a different search term</div>
        </div>
        <div style="padding: 14px 24px; background: var(--gray-100); font-size: 12px; color: var(--gray-500); display: flex; justify-content: space-between;">
          <span><kbd style="padding: 2px 6px; background: var(--white); border-radius: 4px; font-family: monospace;">↑↓</kbd> Navigate</span>
          <span><kbd style="padding: 2px 6px; background: var(--white); border-radius: 4px; font-family: monospace;">↵</kbd> Select</span>
          <span><kbd style="padding: 2px 6px; background: var(--white); border-radius: 4px; font-family: monospace;">ESC</kbd> Close</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    input = document.getElementById('ppSearchInput');
    results = document.getElementById('ppSearchResults');
    recentContainer = document.getElementById('ppRecentContainer');
    noResults = document.getElementById('ppNoResults');

    renderRecent();

    input.addEventListener('input', (e) => performSearch(e.target.value));
    input.addEventListener('keydown', handleKeyNav);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); open();
      }
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  function open() {
    createOverlay();
    overlay.style.display = 'flex';
    isOpen = true;
    setTimeout(() => input?.focus(), 100);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (overlay) overlay.style.display = 'none';
    if (input) { input.value = ''; results.innerHTML = ''; }
    if (recentContainer) recentContainer.style.display = 'block';
    if (noResults) noResults.style.display = 'none';
    isOpen = false;
    document.body.style.overflow = '';
  }

  function performSearch(query, targetContainer) {
    const container = targetContainer || results;
    const recentEl = targetContainer ? null : recentContainer;
    const noResEl = targetContainer ? null : noResults;

    if (recentEl) recentEl.style.display = query.trim() ? 'none' : 'block';

    if (!query.trim()) {
      container.innerHTML = '';
      if (noResEl) noResEl.style.display = 'none';
      return;
    }

    const q = query.toLowerCase().trim();
    const matches = SEARCH_DATA.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q)
    ).slice(0, 8);

    if (matches.length === 0) {
      container.innerHTML = '';
      if (noResEl) noResEl.style.display = 'block';
      return;
    }

    if (noResEl) noResEl.style.display = 'none';
    container.innerHTML = matches.map((m, i) => `
      <a href="${m.url}" data-result="${i}" style="
        display: flex; align-items: center; gap: 14px; padding: 14px 24px;
        text-decoration: none; color: inherit; transition: background 0.15s;
        border-left: 3px solid transparent;
      "
      onmouseover="this.style.background='var(--gray-100)'; this.style.borderLeftColor='var(--primary)';"
      onmouseout="this.style.background='transparent'; this.style.borderLeftColor='transparent';">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(30,64,175,0.08);
          display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 18px; flex-shrink: 0;">
          <i class="bi ${m.icon}"></i>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--gray-900);">${highlightMatch(m.title, q)}</div>
          <div style="font-size: 13px; color: var(--gray-500);">${m.type}</div>
        </div>
        <i class="bi bi-arrow-right" style="color: var(--gray-400); font-size: 14px;"></i>
      </a>
    `).join('');

    saveRecent(query.trim());
  }

  function highlightMatch(text, q) {
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return text.slice(0, idx) +
      `<mark style="background: rgba(249,115,22,0.18); color: var(--secondary); padding: 0 2px; border-radius: 3px;">${text.slice(idx, idx + q.length)}</mark>` +
      text.slice(idx + q.length);
  }

  function handleKeyNav(e) {
    const items = results.querySelectorAll('[data-result]');
    let active = results.querySelector('[data-result].active');
    let idx = active ? parseInt(active.getAttribute('data-result')) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = (idx + 1) % items.length;
      if (active) active.style.background = '';
      if (active) active.style.borderLeftColor = 'transparent';
      items[idx].style.background = 'var(--gray-100)';
      items[idx].style.borderLeftColor = 'var(--primary)';
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = (idx - 1 + items.length) % items.length;
      if (active) active.style.background = '';
      if (active) active.style.borderLeftColor = 'transparent';
      items[idx].style.background = 'var(--gray-100)';
      items[idx].style.borderLeftColor = 'var(--primary)';
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault();
      addRecentSelection(items[idx].href);
      window.location.href = items[idx].href;
    }
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem('pp_search_recent') || '[]'); }
    catch (_) { return []; }
  }

  function saveRecent(term) {
    const recent = getRecent().filter(r => r.term !== term);
    recent.unshift({ term, at: Date.now() });
    localStorage.setItem('pp_search_recent', JSON.stringify(recent.slice(0, 5)));
    renderRecent();
  }

  function addRecentSelection(url) {
    const item = SEARCH_DATA.find(d => d.url === url);
    if (item) saveRecent(item.title);
  }

  function renderRecent() {
    const list = document.getElementById('ppRecentList');
    if (!list) return;
    const recent = getRecent();
    if (recent.length === 0) {
      list.innerHTML = `<span style="font-size: 12px; color: var(--gray-400);">No recent searches</span>`;
      return;
    }
    list.innerHTML = recent.map(r => `
      <button class="recent-chip" data-term="${escapeHtml(r.term)}" style="
        padding: 6px 12px; font-size: 13px; background: var(--gray-100); border: 1px solid var(--gray-200);
        border-radius: 50px; cursor: pointer; color: var(--gray-700); transition: all 0.2s;
      "
      onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)';"
      onmouseout="this.style.borderColor='var(--gray-200)'; this.style.color='var(--gray-700)';">
        ${escapeHtml(r.term)}
      </button>
    `).join('');
    list.querySelectorAll('.recent-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.getAttribute('data-term');
        performSearch(input.value);
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', init);

})();
