(() => {
  if (!window.ParcelProAuth?.requireRole('admin')) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const users = () => window.ParcelProAuth.users();
  const parcels = () => window.ParcelProStore?.getAll() || [];
  const STATUSES = window.ParcelProStore?.STATUSES || ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };

  /* Toast helper (page may not have main.js showToast) */
  const toast = (msg, type = 'info', ms = 2600) => {
    if (typeof window.showToast === 'function') { window.showToast(msg, type); return; }
    const t = $('#appToast'); if (!t) return;
    const body = t.querySelector('.toast-body'); if (!body) return;
    body.textContent = msg;
    body.className = 'toast-body ' + (
      type === 'success' ? 'text-success' :
      type === 'error' ? 'text-danger' :
      type === 'warning' ? 'text-warning' : 'text-primary'
    );
    bootstrap?.Toast.getOrCreateInstance(t, { delay: ms }).show();
  };

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso); if (isNaN(d)) return String(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusBadge = (status) => {
    const cls = (
      status === 'Delivered' ? 'bg-success text-white' :
      status === 'Out for Delivery' ? 'bg-info text-white' :
      status === 'In Transit' ? 'bg-primary text-white' :
      status === 'Picked Up' ? 'bg-secondary text-white' :
      status === 'Order Placed' || status === 'Pending' ? 'bg-warning text-dark' :
      'bg-light text-dark'
    );
    return `<span class="badge rounded-pill ${cls}" style="font-size:11px; padding:6px 12px;">${escapeHtml(status)}</span>`;
  };

  /* ============================================================
   * Global logout wiring
   * ============================================================ */
  $$('[data-logout]').forEach(btn => btn.addEventListener('click', () => {
    window.ParcelProAuth.logout();
  }));

  /* ============================================================
   * Dashboard home: stat cards + quick stats
   * ============================================================ */
  if ($('#totalUsers')) {
    const all = parcels();
    setText('#totalUsers', users().length);
    setText('#totalParcels', all.length);
    setText('#pendingParcels', all.filter(p => ['Order Placed', 'Picked Up', 'In Transit', 'Out for Delivery', 'Pending'].includes(p.status)).length);
    setText('#deliveredParcels', all.filter(p => p.status === 'Delivered').length);
  }

  /* ============================================================
   * Customers page table
   * ============================================================ */
  const customersTable = $('#customersTableBody');
  if (customersTable) {
    const renderCustomers = (filter = '') => {
      const visible = users().filter(u =>
        `${u.name} ${u.email} ${u.phone || ''}`.toLowerCase().includes(filter.toLowerCase())
      );
      customersTable.innerHTML = visible.map(u => `
        <tr>
          <td>${escapeHtml(u.id)}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="user-avatar-sm bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center" style="width:32px;height:32px;font-weight:700;font-size:12px;">
                ${escapeHtml((u.name || 'U')[0].toUpperCase())}
              </div>
              <div>
                <div class="fw-semibold">${escapeHtml(u.name)}</div>
                <small class="text-muted">${escapeHtml(u.email)}</small>
              </div>
            </div>
          </td>
          <td>${escapeHtml(u.phone || '—')}</td>
          <td>${fmtDate(u.createdAt)}</td>
          <td>${parcels().filter(p => p.ownerEmail === u.email).length}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-danger" data-delete-user="${escapeHtml(u.id)}">
              <i class="bi bi-trash me-1"></i> Delete
            </button>
          </td>
        </tr>
      `).join('');
      setText('#customersCount', `${visible.length} user${visible.length === 1 ? '' : 's'}`);
      $('#customersEmpty')?.classList.toggle('d-none', visible.length !== 0);
    };
    renderCustomers('');
    $('#customerSearch')?.addEventListener('input', e => renderCustomers(e.target.value));
    customersTable.addEventListener('click', (e) => {
      const id = e.target.closest('[data-delete-user]')?.dataset?.deleteUser;
      if (!id) return;
      if (confirm('Delete this user account? Their parcels will remain in the system.')) {
        window.ParcelProAuth.deleteUser(id);
        toast('User deleted.', 'success');
        renderCustomers($('#customerSearch')?.value || '');
      }
    });
  }

  /* ============================================================
   * Orders page table (with status update + delete)
   * ============================================================ */
  const ordersTable = $('#ordersTableBody');
  if (ordersTable) {
    const statusOptions = STATUSES.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

    const renderOrders = (filter = '') => {
      const all = parcels().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const visible = all.filter(p => {
        const hay = [
          p.id, p.trackingId,
          p.senderName, p.senderEmail, p.senderPhone, p.ownerEmail,
          p.receiverName, p.receiverPhone,
          p.pickupCity, p.deliveryCity,
          p.parcelType, p.deliveryType, p.serviceLevel,
          p.status
        ].join(' ').toLowerCase();
        return hay.includes(filter.toLowerCase());
      });

      ordersTable.innerHTML = visible.map(p => {
        const id = p.id || p.trackingId;
        const route = p.pickupCity && p.deliveryCity
          ? `${escapeHtml(p.pickupCity)} <i class="bi bi-arrow-right mx-1 text-muted"></i> ${escapeHtml(p.deliveryCity)}`
          : '—';
        const receiver = p.receiverName
          ? `<div><div class="fw-semibold">${escapeHtml(p.receiverName)}</div><small class="text-muted">${escapeHtml(p.receiverPhone || '')}</small></div>`
          : '—';
        const customer = p.senderName || p.ownerEmail
          ? `<div><div class="fw-semibold">${escapeHtml(p.senderName || p.ownerEmail?.split('@')[0] || 'Guest')}</div><small class="text-muted">${escapeHtml(p.ownerEmail || p.senderPhone || 'guest user')}</small></div>`
          : '—';
        return `
          <tr>
            <td>
              <div class="fw-bold text-primary small" style="font-family:monospace; letter-spacing:.3px;">${escapeHtml(id)}</div>
              <div class="small text-muted">${escapeHtml(p.parcelType || p.deliveryType || '')}</div>
            </td>
            <td>${customer}</td>
            <td>${receiver}</td>
            <td class="small">${route}</td>
            <td class="small">${fmtDate(p.createdAt)}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                ${statusBadge(p.status)}
              </div>
            </td>
            <td class="text-end">
              <div class="d-inline-flex flex-wrap justify-content-end gap-2">
                <select class="form-select form-select-sm" data-status="${escapeHtml(id)}" aria-label="Update status" style="width:auto; display:inline-block; min-width:150px;">
                  ${STATUSES.map(s => `<option value="${escapeHtml(s)}" ${s === p.status ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                </select>
                <a class="btn btn-sm btn-outline-info" href="../tracking.html?q=${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer" title="Open tracking">
                  <i class="bi bi-eye"></i>
                </a>
                <button class="btn btn-sm btn-outline-primary" data-advance="${escapeHtml(id)}" title="Advance to next step">
                  <i class="bi bi-chevron-double-right"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" data-delete="${escapeHtml(id)}" title="Delete parcel">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      setText('#ordersCount', `${visible.length} parcel${visible.length === 1 ? '' : 's'}`);
      $('#ordersEmpty')?.classList.toggle('d-none', visible.length !== 0);
    };

    renderOrders('');
    $('#orderSearch')?.addEventListener('input', e => renderOrders(e.target.value));

    /* Handle status dropdown change */
    ordersTable.addEventListener('change', (e) => {
      const id = e.target.closest('[data-status]')?.dataset?.status;
      if (!id) return;
      const newStatus = e.target.value;
      try {
        window.ParcelProStore.updateStatus(id, newStatus);
        toast(`Status updated to "${newStatus}"`, 'success');
      } catch (err) {
        toast('Failed to update status.', 'error');
      }
    });

    /* Handle delete */
    ordersTable.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-delete]');
      if (deleteBtn) {
        const id = deleteBtn.dataset.delete;
        if (confirm(`Delete parcel ${id}? This action cannot be undone.`)) {
          window.ParcelProStore.remove(id);
          toast(`Parcel ${id} deleted.`, 'success');
          renderOrders($('#orderSearch')?.value || '');
        }
        return;
      }
      const advBtn = e.target.closest('[data-advance]');
      if (advBtn) {
        const id = advBtn.dataset.advance;
        try {
          const next = window.ParcelProStore.advanceStatus(id);
          toast(`Status advanced to "${next}"`, 'success');
          renderOrders($('#orderSearch')?.value || '');
        } catch (err) {
          toast(err.message || 'Could not advance status.', 'warning');
        }
        return;
      }
    });
  }

  /* ============================================================
   * Settings: site-wide (no-op placeholders) + reset admin demo
   * ============================================================ */
  if ($('#resetDemoBtn')) {
    $('#resetDemoBtn').addEventListener('click', () => {
      if (!confirm('Reset demo parcels and users? This clears all data and re-seeds the demo shipment.')) return;
      localStorage.removeItem('parcelpro_users');
      localStorage.removeItem('parcelpro_parcels');
      window.location.reload();
    });
  }
  if ($('#seedDemoBtn')) {
    $('#seedDemoBtn').addEventListener('click', () => {
      window.ParcelProStore.ensureDemoShipment();
      toast('Demo shipment seeded.', 'success');
    });
  }

  /* ============================================================
   * Messages page (simple demo)
   * ============================================================ */
  const messagesList = $('#messagesList');
  if (messagesList && !messagesList.dataset.inited) {
    messagesList.dataset.inited = '1';
    const demoMsgs = [
      { name: 'Olivia Carter', email: 'olivia@example.com', subject: 'Bulk shipping quote for 50+ packages', date: Date.now() - 3600 * 1000 * 5, preview: "Hi, we're looking to set up a corporate account for outbound ecommerce fulfillment..." },
      { name: 'Daniel Kim', email: 'daniel@example.com', subject: 'Change delivery address for PK20258432A', date: Date.now() - 3600 * 1000 * 26, preview: "Hello — can you redirect my parcel to a different building? I won't be home at the original address this week." },
      { name: 'Emma Williams', email: 'emma@example.com', subject: 'International customs invoice missing', date: Date.now() - 3600 * 1000 * 72, preview: "My parcel shipped last night but the commercial invoice wasn't attached to the package. Please resend..." }
    ];
    messagesList.innerHTML = demoMsgs.map(m => `
      <div class="list-group-item border rounded-3 mb-2 p-3">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-1 flex-wrap">
          <div>
            <div class="fw-semibold">${escapeHtml(m.name)} <small class="text-muted fw-normal">&lt;${escapeHtml(m.email)}&gt;</small></div>
            <div class="fw-semibold text-primary">${escapeHtml(m.subject)}</div>
          </div>
          <small class="text-muted text-nowrap">${fmtDate(m.date)}</small>
        </div>
        <p class="mb-2 small text-muted">${escapeHtml(m.preview)}</p>
        <div class="d-flex gap-2">
          <a class="btn btn-sm btn-outline-primary" href="mailto:${escapeHtml(m.email)}"><i class="bi bi-reply me-1"></i> Reply</a>
          <button class="btn btn-sm btn-outline-secondary" type="button"><i class="bi bi-archive me-1"></i> Close</button>
        </div>
      </div>
    `).join('');
  }
})();
