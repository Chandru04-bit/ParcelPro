(() => {
  const user = window.ParcelProAuth?.requireRole('user');
  if (!user) return;

  document.body.classList.add('has-public-navbar');

  /* ========== Helpers ========== */
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso); if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const fmtDateTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso); if (isNaN(d)) return String(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const fmtMoney = (n) => '$' + (Number(n || 0)).toFixed(2);
  const toast = (msg, type = 'success') => {
    if (typeof window.showToast === 'function') return window.showToast(msg, type);
    const el = $('#appToast .toast-body');
    const toastEl = $('#appToast');
    if (el && toastEl) {
      el.textContent = msg;
      toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info', 'border-0');
      if (type === 'error') toastEl.classList.add('text-bg-danger');
      else if (type === 'warning') toastEl.classList.add('text-bg-warning');
      else toastEl.classList.add('text-bg-success');
      bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2800 }).show();
    }
  };

  /* ========== Theme bridge: sync [data-theme="dark"] <-> body.dark-mode ========== */
  const syncThemeClass = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    const toggles = $$('.customer-navbar-icon[aria-label="Toggle theme"], [data-theme-toggle]');
    toggles.forEach(t => {
      const icon = t.querySelector('i') || t;
      const cls = isDark ? 'bi-moon-stars-fill' : 'bi-sun-fill';
      icon.className = icon.className.replace(/bi-[\w-]+/g, '') + ' ' + cls;
    });
    const sw = $('#darkMode');
    if (sw) sw.checked = isDark;
  };
  syncThemeClass();
  window.addEventListener('pp-theme-change', syncThemeClass);
  document.addEventListener('DOMContentLoaded', syncThemeClass);
  setTimeout(syncThemeClass, 50);

  /* ========== Customer navbar theme toggle buttons (bind to ParcelProTheme) ========== */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.customer-navbar-icon[aria-label="Toggle theme"]');
    if (btn && window.ParcelProTheme) {
      e.preventDefault();
      e.stopPropagation();
      window.ParcelProTheme.toggleTheme();
    }
  });

  /* ========== Sidebar toggle + backdrop (for mobile) ========== */
  const sidebar = $('.dash-sidebar');
  const backdrop = $('.sidebar-backdrop');
  const closeSidebar = () => {
    sidebar?.classList.remove('show');
    backdrop?.classList.remove('show');
    $$('[data-sidebar-toggle]').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-label', 'Toggle menu');
    });
  };
  const openSidebar = () => {
    sidebar?.classList.add('show');
    backdrop?.classList.add('show');
    $$('[data-sidebar-toggle]').forEach(b => {
      b.setAttribute('aria-expanded', 'true');
      b.setAttribute('aria-label', 'Close menu');
    });
  };
  $$('[data-sidebar-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sidebar?.classList.contains('show')) closeSidebar();
      else openSidebar();
    });
  });
  backdrop?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  /* ========== Password visibility toggle ========== */
  document.addEventListener('click', (e) => {
    const tgl = e.target.closest('[data-password-toggle]');
    if (!tgl) return;
    e.preventDefault();
    const sel = tgl.getAttribute('data-password-toggle');
    const input = sel ? document.querySelector(sel) : tgl.closest('.input-group')?.querySelector('input');
    if (!input) return;
    const icon = tgl.querySelector('i') || tgl;
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = icon.className.replace(/bi-eye[\w-]*/g, 'bi-eye-slash');
    } else {
      input.type = 'password';
      icon.className = icon.className.replace(/bi-eye-slash[\w-]*/g, 'bi-eye');
    }
  });

  /* ========== Fill user across the page ========== */
  const fillUser = () => {
    $$('[data-user-name], [data-dashboard-name]').forEach(el => el.textContent = user.name);
    $$('[data-user-email]').forEach(el => el.textContent = user.email);
    const initials = user.name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
    $$('[data-user-initials]').forEach(el => el.textContent = initials || 'U');
  };
  fillUser();

  /* ========== Logout handlers ========== */
  $$('[data-logout]').forEach(btn => btn.addEventListener('click', () => window.ParcelProAuth.logout()));

  /* ========== Ensure demo/sample parcels exist for current user ========== */
  const parcelsOfUser = () => window.ParcelProStore.byUser(user.email);
  const ensureSampleParcels = () => {
    const existing = parcelsOfUser();
    if (existing.length > 0) return;
    const samples = [
      {
        userEmail: user.email,
        senderName: user.name,
        senderPhone: '+1 (555) 010-2020',
        pickupAddress: '123 Market St, Downtown',
        pickupCity: 'New York',
        pickupDate: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
        receiverName: 'Sarah Johnson',
        receiverPhone: '+1 (555) 444-7788',
        receiverAddress: '456 Ocean Dr, Apt 12B',
        deliveryCity: 'Los Angeles',
        parcelType: 'Box',
        weight: 3.2,
        deliveryType: 'Express',
        serviceLevel: 'Express (1–2 days)',
        status: 'Delivered',
        paymentMethod: 'Credit or Debit Card',
        paymentReference: 'Visa •• 1234',
        totalAmount: 68.50
      },
      {
        userEmail: user.email,
        senderName: user.name,
        senderPhone: '+1 (555) 010-2020',
        pickupAddress: '123 Market St, Downtown',
        pickupCity: 'New York',
        pickupDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        receiverName: 'David Martinez',
        receiverPhone: '+1 (555) 777-3310',
        receiverAddress: '888 Lakeshore Blvd',
        deliveryCity: 'Chicago',
        parcelType: 'Documents',
        weight: 0.8,
        deliveryType: 'Domestic',
        serviceLevel: 'Standard Domestic (3–5 days)',
        status: 'In Transit',
        paymentMethod: 'Digital Wallet',
        paymentReference: 'PayPal • user@example.com',
        totalAmount: 32.40
      },
      {
        userEmail: user.email,
        senderName: user.name,
        senderPhone: '+1 (555) 010-2020',
        pickupAddress: '123 Market St, Downtown',
        pickupCity: 'New York',
        pickupDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        receiverName: 'Emma Williams',
        receiverPhone: '+1 (555) 202-4455',
        receiverAddress: '555 Pine Ave, Suite 300',
        deliveryCity: 'Houston',
        parcelType: 'Fragile item',
        weight: 5.5,
        deliveryType: 'Domestic',
        serviceLevel: 'Standard Domestic (3–5 days)',
        status: 'Pending',
        paymentMethod: 'Cash on Pickup',
        paymentReference: '-',
        totalAmount: 54.75
      }
    ];
    samples.forEach(s => window.ParcelProStore.create(s));
  };
  ensureSampleParcels();

  /* ========== Stats ========== */
  const countStats = () => {
    const all = parcelsOfUser();
    return {
      total: all.length,
      delivered: all.filter(p => p.status === 'Delivered').length,
      transit: all.filter(p => ['In Transit', 'Out for Delivery'].includes(p.status)).length,
      pending: all.filter(p => !['Delivered'].includes(p.status)).length
    };
  };
  const stats = countStats();
  $$('[data-stat]').forEach(el => el.textContent = stats[el.dataset.stat] ?? 0);

  /* Dashboard summary text */
  const dashSummary = $('[data-dashboard-summary]');
  if (dashSummary) {
    if (stats.total === 0) dashSummary.textContent = 'Start by booking your first parcel.';
    else if (stats.delivered === stats.total) dashSummary.textContent = `All ${stats.total} parcels delivered successfully!`;
    else dashSummary.textContent = `You have ${stats.transit + stats.pending} active shipment${(stats.transit + stats.pending) !== 1 ? 's' : ''}.`;
  }

  /* ========== Status badges with exact colors (Delivered=Green, Pending=Orange, In Transit=Blue) ========== */
  const statusBadge = (status) => {
    const s = String(status || 'Pending');
    let cls = '', dot = '', label = s;
    if (s === 'Delivered') {
      cls = 'background:#dcfce7;color:#15803d;border:1px solid #86efac;';
      dot = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-right:6px;box-shadow:0 0 0 3px rgba(34,197,94,.15);"></span>';
    } else if (s === 'In Transit' || s === 'Out for Delivery') {
      cls = 'background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;';
      dot = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#3b82f6;margin-right:6px;box-shadow:0 0 0 3px rgba(59,130,246,.15);"></span>';
    } else if (s === 'Picked Up') {
      cls = 'background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;';
      dot = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#8b5cf6;margin-right:6px;box-shadow:0 0 0 3px rgba(139,92,246,.15);"></span>';
    } else if (s === 'Order Placed' || s === 'Pending') {
      cls = 'background:#fff7ed;color:#c2410c;border:1px solid #fdba74;';
      dot = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#f97316;margin-right:6px;box-shadow:0 0 0 3px rgba(249,115,22,.15);"></span>';
      label = s === 'Order Placed' ? 'Pending' : s;
    } else {
      cls = 'background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;';
      dot = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#64748b;margin-right:6px;"></span>';
    }
    return `<span class="badge rounded-pill" style="${cls}padding:6px 14px;font-size:11px;font-weight:700;letter-spacing:.2px;">${dot}${escapeHtml(label)}</span>`;
  };

  /* ========== Modal: open parcel details ========== */
  const modalEl = $('#parcelDetailsModal');
  let modal = null;
  if (modalEl) modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  const openParcelModal = (parcelId) => {
    const p = window.ParcelProStore.getById(parcelId);
    if (!p) { toast('Parcel not found.', 'error'); return; }
    const id = p.id || p.trackingId;
    const q = p.quote || {};
    $('#parcelDetailsTitle').textContent = `Parcel ${id}`;

    const route = (p.pickupCity || p.deliveryCity)
      ? `
        <div class="mb-3 p-3 rounded-3" style="background:linear-gradient(135deg,rgba(30,64,175,.04),rgba(249,115,22,.04));">
          <div class="d-flex align-items-start justify-content-between gap-3">
            <div>
              <div class="small text-muted text-uppercase mb-1" style="font-size:10px;letter-spacing:1px;">Pickup</div>
              <div class="fw-semibold">${escapeHtml(p.pickupCity || '—')}</div>
              <div class="small text-muted">${escapeHtml(p.pickupAddress || p.senderAddress || '—')}</div>
            </div>
            <div class="text-primary pt-1"><i class="bi bi-arrow-right fs-4"></i></div>
            <div class="text-end">
              <div class="small text-muted text-uppercase mb-1" style="font-size:10px;letter-spacing:1px;">Deliver</div>
              <div class="fw-semibold">${escapeHtml(p.deliveryCity || '—')}</div>
              <div class="small text-muted">${escapeHtml(p.receiverAddress || '—')}</div>
            </div>
          </div>
        </div>` : '';

    /* Build mini timeline for parcel modal */
    const tl = Array.isArray(p.timeline) && p.timeline.length ? p.timeline : window.ParcelProStore.buildTimeline(p);
    const tlHtml = `
      <div class="mt-3 mb-1">
        <div class="small text-muted text-uppercase mb-2" style="font-size:10px;letter-spacing:1px;">Shipment Timeline</div>
        <div style="max-height:230px;overflow-y:auto;padding-right:4px;">
          ${tl.slice().reverse().map((step, i, arr) => `
            <div style="display:grid;grid-template-columns:28px 1fr;gap:10px;padding:${i === arr.length - 1 ? '0 0 0' : '0 0 14px'};position:relative;">
              ${i < arr.length - 1 ? `<div style="position:absolute;left:13px;top:28px;bottom:0;width:2px;background:${step.done ? '#3b82f6' : '#e2e8f0'};"></div>` : ''}
              <div style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0;z-index:1;
                background:${step.active ? '#f97316' : step.done ? '#22c55e' : '#e2e8f0'};
                color:${step.active || step.done ? '#fff' : '#64748b'};
                box-shadow:${step.active ? '0 0 0 4px rgba(249,115,22,.15)' : 'none'};
                border:0;">
                ${step.done ? '<i class="bi bi-check-lg" style="font-size:12px;"></i>' : (step.active ? '<i class="bi bi-dot" style="font-size:14px;"></i>' : (arr.length - i))}
              </div>
              <div>
                <div class="fw-semibold" style="font-size:13px;color:${step.active || step.done ? 'var(--dash-ink)' : '#94a3b8'};">${escapeHtml(step.status)}</div>
                <div class="small" style="color:#64748b;font-size:11.5px;">${escapeHtml(step.location || '')}</div>
                <div class="small" style="color:#94a3b8;font-size:11px;">${fmtDateTime(step.date)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    $('#parcelDetailsContent').innerHTML = `
      <div class="mb-3 d-flex align-items-center gap-2 flex-wrap">
        ${statusBadge(p.status || 'Order Placed')}
        <span class="small text-muted">Created ${fmtDate(p.createdAt)}</span>
        ${q.etaText ? `<span class="small text-muted">· ETA: ${escapeHtml(q.etaText)}</span>` : ''}
      </div>
      ${route}
      <div class="row g-3 mb-3">
        <div class="col-6"><div class="small text-muted text-uppercase" style="font-size:10px;letter-spacing:1px;">Sender</div><div class="fw-semibold">${escapeHtml(p.senderName || user.name)}</div><div class="small text-muted">${escapeHtml(p.senderPhone || user.email)}</div></div>
        <div class="col-6"><div class="small text-muted text-uppercase" style="font-size:10px;letter-spacing:1px;">Receiver</div><div class="fw-semibold">${escapeHtml(p.receiverName || '—')}</div><div class="small text-muted">${escapeHtml(p.receiverPhone || '—')}</div></div>
        <div class="col-6"><div class="small text-muted text-uppercase" style="font-size:10px;letter-spacing:1px;">Weight</div><div class="fw-semibold">${escapeHtml(p.weight || q.weight || '—')} kg</div></div>
        <div class="col-6"><div class="small text-muted text-uppercase" style="font-size:10px;letter-spacing:1px;">Type</div><div class="fw-semibold">${escapeHtml(p.parcelType || p.type || p.deliveryType || 'Standard')}</div></div>
        <div class="col-6"><div class="small text-muted text-uppercase" style="font-size:10px;letter-spacing:1px;">Service</div><div class="fw-semibold">${escapeHtml(p.deliveryType || p.serviceLevel || 'Standard')}</div></div>
        <div class="col-6"><div class="small text-muted text-uppercase" style="font-size:10px;letter-spacing:1px;">Total Paid</div><div class="fw-semibold text-primary">${fmtMoney(p.totalAmount || q.total || 0)}</div></div>
      </div>
      ${tlHtml}
      <div class="d-flex gap-2 flex-wrap mt-3">
        <a href="../tracking.html?q=${encodeURIComponent(id)}" class="btn btn-primary flex-grow-1"><i class="bi bi-geo-alt me-1"></i> Track Now</a>
        <button type="button" class="btn btn-outline-secondary flex-grow-1" onclick="navigator.clipboard?.writeText('${escapeHtml(id)}').then(()=>{});"><i class="bi bi-copy me-1"></i> Copy ID</button>
      </div>
    `;
    modal?.show();
  };

  /* ========== Recent parcels (dashboard.html) ========== */
  const recent = $('[data-recent-parcels]');
  if (recent) {
    const list = parcelsOfUser().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    if (list.length === 0) {
      recent.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No parcels yet.</td></tr>';
    } else {
      recent.innerHTML = list.map(p => {
        const id = p.id || p.trackingId;
        return `<tr>
          <td class="fw-bold text-primary small" style="font-family:monospace;">${escapeHtml(id)}</td>
          <td>${escapeHtml(p.receiverName || '—')}</td>
          <td>${fmtDate(p.createdAt)}</td>
          <td>${statusBadge(p.status || 'Order Placed')}</td>
          <td class="text-end"><button class="btn btn-sm btn-outline-primary" data-parcel="${escapeHtml(id)}">View</button></td>
        </tr>`;
      }).join('');
    }
  }

  /* ========== My Parcels table ========== */
  const table = $('#parcelsTableBody');
  if (table) {
    const render = (filter = '') => {
      const list = parcelsOfUser().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const visible = list.filter(p => `${p.id} ${p.trackingId || ''} ${p.receiverName || ''} ${p.status || ''} ${p.pickupCity || ''} ${p.deliveryCity || ''}`.toLowerCase().includes(filter.toLowerCase()));
      if (visible.length === 0) {
        table.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No parcels match your search.</td></tr>';
      } else {
        table.innerHTML = visible.map(p => {
          const id = p.id || p.trackingId;
          return `<tr>
            <td class="fw-bold text-primary small" style="font-family:monospace; letter-spacing:.3px;">${escapeHtml(id)}</td>
            <td>
              <div class="fw-semibold">${escapeHtml(p.receiverName || '—')}</div>
              <div class="small text-muted">${escapeHtml(p.receiverPhone || p.deliveryCity || '')}</div>
            </td>
            <td>${fmtDate(p.createdAt)}</td>
            <td>${statusBadge(p.status || 'Order Placed')}</td>
            <td>
              <div class="d-flex gap-1 justify-content-end">
                <button class="btn btn-sm btn-outline-primary" data-parcel="${escapeHtml(id)}"><i class="bi bi-eye me-1"></i>View</button>
                <a class="btn btn-sm btn-outline-info" href="../tracking.html?q=${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt me-1"></i>Track</a>
              </div>
            </td>
          </tr>`;
        }).join('');
      }
    };
    render('');
    $('#parcelSearch')?.addEventListener('input', e => render(e.target.value));
  }

  /* ========== Anywhere: bind [data-parcel] click ========== */
  document.addEventListener('click', (e) => {
    const id = e.target.closest('[data-parcel]')?.dataset?.parcel;
    if (id) openParcelModal(id);
  });

  /* ========== Profile ========== */
  const profile = $('form[data-form="profile"]');
  if (profile) {
    const nameInput = profile.querySelector('[name="name"]') || profile.querySelectorAll('input')[0];
    const emailInput = profile.querySelector('[name="email"]') || profile.querySelectorAll('input')[1];
    const phoneInput = profile.querySelector('[name="phone"]') || profile.querySelectorAll('input')[2];
    nameInput.value = user.name;
    emailInput.value = user.email;
    const full = window.ParcelProAuth.users().find(x => x.id === user.id);
    phoneInput.value = full?.phone || '';
    profile.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!profile.checkValidity()) { profile.classList.add('was-validated'); return; }
      const changes = {
        name: nameInput.value.trim(),
        email: emailInput.value,
        phone: phoneInput.value.trim()
      };
      const ok = window.ParcelProAuth.updateUser(user.id, changes);
      if (ok) {
        user.name = ok.name;
        user.email = ok.email;
        fillUser();
        toast('Profile updated successfully.', 'success');
      } else {
        toast('Could not update profile.', 'error');
      }
    });
  }

  /* ========== Password change ========== */
  const passForm = $('form[data-form="password"]');
  if (passForm) {
    passForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!passForm.checkValidity()) { passForm.classList.add('was-validated'); return; }
      const cur = passForm.querySelector('[name="currentPassword"]')?.value;
      const nw = passForm.querySelector('[name="newPassword"]')?.value;
      const conf = passForm.querySelector('[name="confirmPassword"]')?.value;
      if (nw !== conf) { toast('New passwords do not match.', 'error'); return; }
      const ok = window.ParcelProAuth.resetPassword(user.email, cur, nw);
      if (!ok) { toast('Current password is incorrect.', 'error'); return; }
      passForm.reset();
      passForm.classList.remove('was-validated');
      toast('Password updated successfully.', 'success');
    });
  }
})();

/* ========== Sticky Navbar Scroll Effect & Active Highlighting ========== */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.customer-navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        navbar.style.background = 'rgba(255,255,255,0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
        if (document.body.classList.contains('dark-mode') || document.documentElement.getAttribute('data-theme') === 'dark') {
          navbar.style.background = 'rgba(24, 34, 53, 0.95)';
          navbar.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
        }
      } else {
        navbar.style.boxShadow = '';
        navbar.style.background = '';
        navbar.style.backdropFilter = '';
      }
    });
  }

  // Highlight active link
  const currentPath = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.customer-navbar-links a, .dash-nav a');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href && href.includes(currentPath) && currentPath !== '') {
      link.classList.add('active');
    }
  });
});
