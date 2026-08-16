/* ========== ParcelPro - Main JavaScript ========== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initStickyNav();
    initHomeDropdown();
    initAuthNavigation();
    initNavTrackingOrder();
    initServicesNavigation();
    initSmoothScroll();
    initMobileMenu();
    initCounters();
    initBookingTabs();
    initRevealAnimations();
    initBackToTop();
    initCopyTracking();
    initTooltips();
    initBookingCalculator();
    initAOS();
  });

  function initHomeDropdown() {
    var MOBILE_MQ = window.matchMedia('(max-width: 991.98px)');

    function currentPage() {
      var p = location.pathname.split('/').pop() || 'index.html';
      return p.toLowerCase();
    }
    var page = currentPage();

    document.querySelectorAll('.navbar-nav .home-dropdown, .customer-navbar-links .home-dd').forEach(function (wrap) {
      var isCustomer = wrap.classList.contains('home-dd');
      var toggle = isCustomer
        ? wrap.querySelector('.home-dd-toggle')
        : wrap.querySelector('.home-dd-toggle');
      var menu = isCustomer
        ? wrap.querySelector('.home-dd-submenu')
        : wrap.querySelector('.home-dropdown-menu');
      if (!toggle || !menu) return;

      toggle.setAttribute('aria-haspopup', 'true');
      toggle.setAttribute('aria-expanded', 'false');

      var homeLink1 = menu.querySelector('[data-home="1"]');
      var homeLink2 = menu.querySelector('[data-home="2"]');
      var homeParentActive = (page === 'index.html' || page === 'home2.html');

      if (homeLink1 && page === 'index.html') {
        homeLink1.classList.add('is-active');
        if (!isCustomer) {
          wrap.querySelectorAll(':scope > .nav-link').forEach(function (l) { l.classList.add('active'); });
        } else {
          toggle.classList.add('active');
        }
      }
      if (homeLink2 && page === 'home2.html') {
        homeLink2.classList.add('is-active');
        if (!isCustomer) {
          wrap.querySelectorAll(':scope > .nav-link').forEach(function (l) { l.classList.add('active'); });
        } else {
          toggle.classList.add('active');
        }
      }
      if (isCustomer && homeParentActive) toggle.classList.add('active');

      function open() {
        wrap.classList.add('is-open');
        if (menu.classList.contains('home-dropdown-menu') || menu.classList.contains('home-dd-submenu')) {
          menu.classList.add('is-open');
        }
        toggle.setAttribute('aria-expanded', 'true');
      }
      function close() {
        wrap.classList.remove('is-open');
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
      function toggleOpen(e) {
        e.preventDefault();
        if (wrap.classList.contains('is-open')) close(); else open();
      }

      function attach() {
        if (MOBILE_MQ.matches) {
          toggle.addEventListener('click', toggleOpen);
          menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { close(); });
          });
        } else {
          wrap.addEventListener('mouseenter', open);
          wrap.addEventListener('mouseleave', close);
          toggle.addEventListener('focus', open);
          wrap.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { close(); toggle.blur(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); open(); var first = menu.querySelector('a'); if (first) first.focus(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); var last = menu.querySelectorAll('a'); if (last.length) last[last.length - 1].focus(); }
          });
          menu.querySelectorAll('a').forEach(function (a, idx, arr) {
            a.addEventListener('keydown', function (e) {
              if (e.key === 'ArrowDown') { e.preventDefault(); (arr[idx + 1] || arr[0]).focus(); }
              if (e.key === 'ArrowUp') { e.preventDefault(); (arr[idx - 1] || arr[arr.length - 1]).focus(); }
              if (e.key === 'Escape') { e.preventDefault(); close(); toggle.focus(); }
            });
          });
        }
      }
      function detach() {
        close();
        wrap.removeEventListener('mouseenter', open);
        wrap.removeEventListener('mouseleave', close);
        toggle.removeEventListener('focus', open);
        toggle.removeEventListener('click', toggleOpen);
      }

      attach();
      MOBILE_MQ.addEventListener ? MOBILE_MQ.addEventListener('change', function () { detach(); attach(); })
                                : MOBILE_MQ.addListener(function () { detach(); attach(); });
    });

    document.addEventListener('click', function (e) {
      document.querySelectorAll('.navbar-nav .home-dropdown.is-open, .customer-navbar-links .home-dd.is-open').forEach(function (wrap) {
        if (!wrap.contains(e.target)) {
          wrap.classList.remove('is-open');
          var m = wrap.querySelector('.home-dropdown-menu, .home-dd-submenu');
          if (m) m.classList.remove('is-open');
          var t = wrap.querySelector('.home-dd-toggle');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function initStickyNav() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const stickyClass = 'sticky';
    const threshold = 50;

    function updateSticky() {
      if (window.scrollY > threshold) {
        navbar.classList.add(stickyClass);
      } else {
        navbar.classList.remove(stickyClass);
      }
    }
    updateSticky();
    window.addEventListener('scroll', updateSticky, { passive: true });
  }

  function initAuthNavigation() {
    const actions = document.querySelector('.navbar .nav-actions, .navbar #authNavMenu')?.closest('.nav-actions')
      || document.querySelector('.navbar .d-flex.align-items-center.gap-2');
    if (!actions || !window.ParcelProAuth) return;

    Array.from(actions.querySelectorAll('a')).find(link => link.textContent.trim() === 'Ship Now')?.remove();

    let menu = actions.querySelector('#authNavMenu');
    if (!menu) {
      const signIn = actions.querySelector('a[href="login.html"]');
      if (!signIn) return;
      menu = document.createElement('div');
      menu.className = 'dropdown d-none d-lg-inline-block';
      menu.id = 'authNavMenu';
      signIn.replaceWith(menu);
    }

    menu.className = 'dropdown d-none d-lg-inline-block';

    const activeUser = window.ParcelProAuth.session();
    const persistedUsername = window.ParcelProAuth.username?.() || '';
    const isSignedIn = Boolean(activeUser || persistedUsername);
    const dashboard = 'customer-dashboard/dashboard.html';
    menu.innerHTML = isSignedIn
      ? `<button class="btn btn-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-person-circle me-1"></i><span class="auth-user-name"></span></button>
         <ul class="dropdown-menu dropdown-menu-end rounded-3 border-0 shadow-lg p-2 mt-2">
           <li><a class="dropdown-item rounded-2" href="${dashboard}"><i class="bi bi-grid me-2"></i>Dashboard</a></li>
           <li><hr class="dropdown-divider"></li>
           <li><button class="dropdown-item rounded-2 text-danger" type="button" data-auth-logout><i class="bi bi-box-arrow-right me-2"></i>Logout</button></li>
         </ul>`
      : `<button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-box-arrow-in-right me-1"></i>Sign In</button>
         <ul class="dropdown-menu dropdown-menu-end rounded-3 border-0 shadow-lg p-2 mt-2">
           <li><a class="dropdown-item rounded-2" href="login.html"><i class="bi bi-box-arrow-in-right text-primary me-2"></i>User Sign In</a></li>
           <li><a class="dropdown-item rounded-2" href="register.html"><i class="bi bi-person-plus-fill text-primary me-2"></i>User Sign Up</a></li>
         </ul>`;

    if (isSignedIn) {
      menu.querySelector('.auth-user-name').textContent = persistedUsername || activeUser.name;
      menu.querySelector('[data-auth-logout]').addEventListener('click', () => window.ParcelProAuth.logout());
    }
  }

  function initNavTrackingOrder() {
    document.querySelectorAll('.navbar .navbar-nav').forEach(nav => {
      const trackItem = Array.from(nav.children).find(item => item.querySelector(':scope > .nav-link[href="tracking.html"]'));
      const pagesItem = Array.from(nav.children).find(item => item.querySelector(':scope > .nav-link.dropdown-toggle')?.textContent.trim() === 'Pages');
      if (trackItem && pagesItem && trackItem !== pagesItem.nextElementSibling) {
        pagesItem.insertAdjacentElement('afterend', trackItem);
      }
    });
  }

  function initServicesNavigation() {
    document.querySelectorAll('.navbar .navbar-nav').forEach(nav => {
      const servicesItem = Array.from(nav.children).find(item => item.querySelector(':scope > .nav-link')?.textContent.trim() === 'Services');
      if (!servicesItem) return;

      const servicesLink = servicesItem.querySelector(':scope > .nav-link');
      servicesItem.classList.remove('dropdown', 'mega-dropdown');
      servicesLink.classList.remove('dropdown-toggle');
      servicesLink.href = 'services.html';
      servicesLink.removeAttribute('role');
      servicesLink.removeAttribute('data-bs-toggle');
      servicesLink.removeAttribute('aria-expanded');
      servicesItem.querySelector(':scope > .dropdown-menu')?.remove();
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId.length === 1) return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-btn');
    if (!toggle) return;
    const offcanvas = document.createElement('div');
    offcanvas.className = 'offcanvas offcanvas-end';
    offcanvas.id = 'mobileMenu';
    offcanvas.setAttribute('tabindex', '-1');
    offcanvas.innerHTML = `
      <div class="offcanvas-header border-bottom border-200">
        <h5 class="offcanvas-title font-heading fw-800">
          <span class="text-primary">Parcel</span>Pro
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
      </div>
      <div class="offcanvas-body p-4">
        <ul class="nav flex-column gap-2" id="mobileNav">
        </ul>
        <div class="d-grid gap-2 mt-4 pt-4 border-top border-200" id="mobileAuthActions"></div>
      </div>`;
    document.body.appendChild(offcanvas);

    const mobileNav = offcanvas.querySelector('#mobileNav');
    const srcItems = document.querySelectorAll('.navbar-nav > li');

    function pageBase() {
      return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    }
    const currentPage = pageBase();

    srcItems.forEach(item => {
      const isHomeDropdown = item.classList.contains('home-dropdown');
      if (isHomeDropdown) {
        const wrap = document.createElement('li');
        wrap.className = 'home-dropdown';

        const srcToggle = item.querySelector('.home-dd-toggle');
        const toggleLabel = (srcToggle && srcToggle.textContent.trim().replace(/\s+/g, ' ')) || 'Home';
        const parentActive = (currentPage === 'index.html' || currentPage === 'home2.html');

        const toggleEl = document.createElement('a');
        toggleEl.href = '#';
        toggleEl.className = 'nav-link home-dd-toggle d-flex align-items-center';
        if (parentActive) toggleEl.classList.add('active');
        toggleEl.setAttribute('aria-haspopup', 'true');
        toggleEl.setAttribute('aria-expanded', 'false');
        toggleEl.innerHTML = '<span>' + toggleLabel + '</span><i class="bi bi-chevron-down home-caret ms-auto"></i>';

        const submenu = document.createElement('ul');
        submenu.className = 'home-dropdown-menu';

        const subItems = item.querySelectorAll('.home-dropdown-menu a');
        subItems.forEach(subA => {
          const li = document.createElement('li');
          const a = subA.cloneNode(true);
          a.classList.remove('is-active');
          const isH1 = /index\.html/i.test(a.getAttribute('href') || '');
          const isH2 = /home2\.html/i.test(a.getAttribute('href') || '');
          if ((isH1 && currentPage === 'index.html') || (isH2 && currentPage === 'home2.html')) {
            a.classList.add('is-active');
            if (!toggleEl.classList.contains('active')) toggleEl.classList.add('active');
          }
          a.addEventListener('click', function () {
            try { bootstrap.Offcanvas.getInstance(offcanvas).hide(); } catch (_) {}
          });
          li.appendChild(a);
          submenu.appendChild(li);
        });

        toggleEl.addEventListener('click', function (e) {
          e.preventDefault();
          const open = submenu.classList.toggle('is-open');
          wrap.classList.toggle('is-open', open);
          toggleEl.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        wrap.appendChild(toggleEl);
        wrap.appendChild(submenu);
        mobileNav.appendChild(wrap);
        return;
      }

      const plainLink = item.querySelector(':scope > .nav-link');
      if (!plainLink) return;
      const li = document.createElement('li');
      const a = plainLink.cloneNode(true);
      a.classList.add('nav-link');
      a.addEventListener('click', () => {
        try { bootstrap.Offcanvas.getInstance(offcanvas).hide(); } catch (_) {}
      });
      li.appendChild(a);
      mobileNav.appendChild(li);
    });

    const mobileAuthActions = offcanvas.querySelector('#mobileAuthActions');
    const persistedUsername = window.ParcelProAuth?.username?.() || '';
    if (persistedUsername) {
      mobileAuthActions.innerHTML = `<a href="customer-dashboard/dashboard.html" class="btn btn-primary w-100"><i class="bi bi-person-circle me-1"></i>${persistedUsername}</a><button type="button" class="btn btn-outline-danger w-100" data-mobile-auth-logout>Logout</button>`;
      mobileAuthActions.querySelector('[data-mobile-auth-logout]').addEventListener('click', () => window.ParcelProAuth.logout());
    } else {
      mobileAuthActions.innerHTML = '<a href="login.html" class="btn btn-outline-primary w-100">Sign In</a><a href="register.html" class="btn btn-primary w-100">Get Started</a>';
    }

    toggle.setAttribute('data-bs-toggle', 'offcanvas');
    toggle.setAttribute('data-bs-target', '#mobileMenu');
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = parseInt(el.getAttribute('data-duration'), 10) || 2000;
    const suffix = el.getAttribute('data-suffix') || '';
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(target * eased);
      el.textContent = value.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = target.toLocaleString() + suffix;
    }
    requestAnimationFrame(frame);
  }

  function initBookingTabs() {
    const tabs = document.querySelectorAll('.booking-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    if (items.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(i => observer.observe(i));
  }

  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) {
      const b = document.createElement('button');
      b.id = 'backToTop';
      b.innerHTML = '<i class="bi bi-arrow-up"></i>';
      b.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; width: 48px; height: 48px;
        background: linear-gradient(135deg, var(--primary), var(--primary-light));
        color: #fff; border: none; border-radius: 14px; cursor: pointer;
        display: none; align-items: center; justify-content: center;
        font-size: 18px; box-shadow: 0 8px 20px rgba(30,64,175,0.3);
        z-index: 999; transition: all 0.3s ease;
      `;
      b.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      b.addEventListener('mouseenter', () => b.style.transform = 'translateY(-3px)');
      b.addEventListener('mouseleave', () => b.style.transform = 'translateY(0)');
      document.body.appendChild(b);

      window.addEventListener('scroll', () => {
        b.style.display = window.scrollY > 400 ? 'flex' : 'none';
      }, { passive: true });
    }
  }

  function initCopyTracking() {
    document.querySelectorAll('[data-copy]').forEach(el => {
      el.addEventListener('click', async function () {
        const text = this.getAttribute('data-copy') || this.textContent;
        try {
          await navigator.clipboard.writeText(text);
          const original = this.textContent;
          this.textContent = 'Copied!';
          this.style.cssText = 'color: #10b981;';
          setTimeout(() => {
            this.textContent = original;
            this.style.cssText = '';
          }, 1500);
        } catch (e) {
          console.warn('Copy failed:', e);
        }
      });
    });
  }

  function initTooltips() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(t => {
        new bootstrap.Tooltip(t);
      });
    }
  }

  function initBookingCalculator() {
    const calcBtn = document.getElementById('calculateShipping');
    const resultEl = document.getElementById('shippingResult');
    if (!calcBtn) return;

    calcBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const weight = parseFloat(document.getElementById('calcWeight')?.value) || 1;
      const service = document.getElementById('calcService')?.value || 'standard';
      const distance = parseFloat(document.getElementById('calcDistance')?.value) || 50;

      const rates = { standard: 5, express: 10, same: 18, overnight: 14 };
      const base = rates[service] || rates.standard;
      const wCharge = Math.max(0, weight - 1) * 2.5;
      const dCharge = Math.max(0, distance - 20) * 0.08;
      const total = (base + wCharge + dCharge).toFixed(2);

      if (resultEl) {
        resultEl.innerHTML = `
          <div class="p-4 rounded-3" style="background: linear-gradient(135deg, rgba(30,64,175,0.08), rgba(249,115,22,0.08)); border-radius: 14px;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span style="font-size: 14px; color: #64748b;">Estimated Delivery Time:</span>
              <strong style="color: #1e40af;">${getDeliveryTime(service)}</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span style="font-size: 16px; color: #1e293b;">Total Shipping Cost:</span>
              <strong style="font-size: 28px; color: #f97316; font-weight: 800;">$${total}</strong>
            </div>
          </div>`;
        resultEl.style.display = 'block';
        resultEl.classList.add('animate-fade-in-up');
      }
    });
  }

  function getDeliveryTime(service) {
    const times = {
      standard: '3-5 Business Days',
      express: '1-2 Business Days',
      same: 'Same Day',
      overnight: 'Next Day'
    };
    return times[service] || '3-5 Business Days';
  }

  function initAOS() {
    if (window.AOS) {
      try {
        window.AOS.init({
          duration: 800,
          easing: 'ease-out-cubic',
          once: true,
          offset: 60,
          startEvent: 'DOMContentLoaded'
        });
        return;
      } catch (e) { /* fall through to lightweight observer */ }
    }
    const aosItems = document.querySelectorAll('[data-aos]');
    if (aosItems.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.getAttribute('data-aos-delay') || '0', 10);
          setTimeout(() => {
            entry.target.classList.add('aos-animate');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    aosItems.forEach(i => observer.observe(i));
  }

  window.ParcelPro = {
    togglePassword(inputId, button) {
      const input = document.getElementById(inputId);
      if (!input) return;
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      const icon = button?.querySelector('i');
      if (icon) { icon.classList.toggle('bi-eye', !visible); icon.classList.toggle('bi-eye-slash', visible); }
    },
    trackShipment(trackingNo) {
      const no = String(trackingNo || document.getElementById('trackingInput')?.value || document.getElementById('trackPublicInput')?.value || document.getElementById('trackInput')?.value || '').trim().toUpperCase();
      if (!no) {
        alert('Please enter a tracking number.');
        const input = document.getElementById('trackingInput') || document.getElementById('trackPublicInput') || document.getElementById('trackInput');
        if (input) input.focus();
        return;
      }
      if (!this.validateTracking(no)) {
        alert('Tracking numbers must contain 5–25 letters or numbers.');
        return;
      }

      const result = document.getElementById('trackingResult');
      const notFound = document.getElementById('trackingNotFound');
      if (result) {
        const input = document.getElementById('trackingInput') || document.getElementById('trackPublicInput');
        const resultNumber = document.getElementById('resultTrackingNo');
        if (input) input.value = no;
        if (resultNumber) resultNumber.textContent = no;
        result.style.display = 'block';
        if (notFound) notFound.style.display = 'none';
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      window.location.href = `tracking.html?q=${encodeURIComponent(no)}`;
    },
    openBooking(event) {
      event?.preventDefault();
      window.location.href = 'booking.html';
    },
    validateTracking(value) {
      return /^[A-Za-z0-9]{5,25}$/.test(value.trim());
    },
    formatCurrency(amount, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },
    formatDate(date, style = 'medium') {
      const d = typeof date === 'string' ? new Date(date) : (date || new Date());
      const options = style === 'short' ? { month: 'short', day: 'numeric', year: 'numeric' }
        : style === 'long' ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };
      return d.toLocaleDateString('en-US', options);
    },
    getStatusColor(status) {
      const map = {
        delivered: 'success',
        transit: 'primary',
        pending: 'warning',
        cancelled: 'danger',
        'out-for-delivery': 'info',
        shipped: 'primary',
        processing: 'warning'
      };
      return map[status?.toLowerCase()] || 'secondary';
    },
    generateId(prefix = 'PK') {
      return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
  };

})();
