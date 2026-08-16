/* ========== ParcelPro - Theme Manager (Dark Mode / RTL) ========== */

(function () {
  'use strict';

  const THEME_KEY = 'pp_theme';
  const RTL_KEY = 'pp_rtl';

  const themes = ['light', 'dark', 'auto'];
  let currentTheme = 'light';

  window.ParcelProTheme = {
    get current() { return currentTheme; },
    setTheme,
    toggleTheme,
    setRTL,
    toggleRTL,
    init,
    getSystemTheme
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    applyTheme(saved);
    currentTheme = saved;

    const savedRtl = localStorage.getItem(RTL_KEY) === 'true';
    applyRTL(savedRtl);

    const toggleBtns = document.querySelectorAll('.theme-toggle, [data-theme-toggle]');
    toggleBtns.forEach(btn => {
      updateBtnIcon(btn, saved);
      btn.addEventListener('click', () => {
        toggleTheme();
      });
    });

    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', () => setTheme(btn.getAttribute('data-set-theme')));
    });

    document.querySelectorAll('[data-rtl-toggle]').forEach(btn => {
      btn.addEventListener('click', toggleRTL);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (currentTheme === 'auto') applyTheme('auto');
    });
  }

  function setTheme(theme) {
    if (!themes.includes(theme)) theme = 'light';
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    currentTheme = theme;
    document.querySelectorAll('.theme-toggle, [data-theme-toggle]').forEach(btn => updateBtnIcon(btn, theme));
    window.dispatchEvent(new CustomEvent('pp-theme-change', { detail: { theme } }));
  }

  function toggleTheme() {
    const order = ['light', 'dark'];
    const idx = order.indexOf(currentTheme === 'auto' ? resolveAutoTheme() : currentTheme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }

  function applyTheme(theme) {
    const effective = theme === 'auto' ? resolveAutoTheme() : theme;
    document.documentElement.setAttribute('data-theme', effective);
    document.body.classList.toggle('dark-theme', effective === 'dark');  }

  function resolveAutoTheme() {
    return getSystemTheme();
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }

  function updateBtnIcon(btn, theme) {
    const resolved = theme === 'auto' ? resolveAutoTheme() : theme;
    if (btn.matches('input[type="checkbox"]')) {
      btn.checked = resolved === 'dark';
      return;
    }

    const icon = btn.querySelector('i') || btn;
    const icons = { light: 'bi-sun-fill', dark: 'bi-moon-stars-fill' };
    const cls = icons[resolved] || icons.light;
    icon.className = icon.className.replace(/bi-[\w-]+/g, '') + ' ' + cls;
    btn.setAttribute('data-theme-state', theme);
    btn.setAttribute('title', resolved === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }

  function setRTL(enabled) {
    localStorage.setItem(RTL_KEY, enabled ? 'true' : 'false');
    applyRTL(enabled);
    window.dispatchEvent(new CustomEvent('pp-rtl-change', { detail: { enabled } }));
  }

  function toggleRTL() {
    const current = document.documentElement.getAttribute('dir') === 'rtl';
    setRTL(!current);
  }

  function applyRTL(enabled) {
    document.documentElement.setAttribute('dir', enabled ? 'rtl' : 'ltr');
    document.body.classList.toggle('rtl-active', enabled);
    const link = document.getElementById('pp-bootstrap-rtl');
    if (enabled && !link) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css';
      l.id = 'pp-bootstrap-rtl';
      document.head.appendChild(l);
    }
    if (!enabled && link) link.remove();
    
    document.querySelectorAll('[data-rtl-toggle]').forEach(btn => {
      btn.textContent = enabled ? 'LTR' : 'RTL';
    });
  }

})();
