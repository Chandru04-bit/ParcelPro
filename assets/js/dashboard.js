let parcelProActiveUser = null;
try { parcelProActiveUser = JSON.parse(localStorage.getItem('parcelpro-session')); } catch { parcelProActiveUser = null; }
if (location.pathname.includes('customer-dashboard') && (!parcelProActiveUser || parcelProActiveUser.role !== 'user')) location.replace('../login.html');
document.addEventListener('DOMContentLoaded', () => {
  const body = document.body, sidebar = document.querySelector('.dash-sidebar'), backdrop = document.querySelector('.sidebar-backdrop');
  if (location.pathname.includes('customer-dashboard')) {
    body.classList.add('has-public-navbar');
    if (!document.querySelector('.customer-navbar')) {
      const currentPage = location.pathname.split('/').pop() || 'dashboard.html';
      const userName = parcelProActiveUser?.name || localStorage.getItem('username') || 'User';
      const nav = document.createElement('nav');
      nav.className = 'customer-navbar';
      nav.setAttribute('aria-label', 'Dashboard navigation');
      nav.innerHTML = `<a class="customer-navbar-brand" href="../index.html"><span class="customer-navbar-logo"><i class="bi bi-box-seam-fill"></i></span>Parcel<span>Pro</span></a><div class="customer-navbar-links"><a class="${currentPage === 'dashboard.html' ? 'active' : ''}" href="dashboard.html">Dashboard</a><a class="${currentPage === 'my-parcels.html' ? 'active' : ''}" href="my-parcels.html">My Parcels</a><a class="${currentPage === 'profile.html' ? 'active' : ''}" href="profile.html">Profile</a><a class="${currentPage === 'settings.html' ? 'active' : ''}" href="settings.html">Settings</a></div><div class="customer-navbar-actions"><a class="customer-navbar-icon" href="../tracking.html" aria-label="Track parcel"><i class="bi bi-search"></i></a><span class="customer-navbar-user"><i class="bi bi-person-circle"></i><span>${userName}</span></span><button class="customer-navbar-logout" type="button" data-logout>Logout</button></div>`;
      body.prepend(nav);
    }
  }
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', event => {
    event.stopImmediatePropagation();
    if (window.ParcelProAuth) { window.ParcelProAuth.logout(); return; }
    localStorage.clear();
    sessionStorage.removeItem('parcelpro-session-temporary');
    location.href = '../index.html';
  }, true));
  const profileForm = document.querySelector('form[data-form="profile"]');
  if (profileForm && parcelProActiveUser) { const inputs = profileForm.querySelectorAll('input'); const users = JSON.parse(localStorage.getItem('parcelpro-users') || '[]'); const saved = users.find(user => user.id === parcelProActiveUser.id); inputs[0].value = parcelProActiveUser.name; inputs[1].value = parcelProActiveUser.email; inputs[2].value = saved?.phone || ''; }
  const showToast = message => { const el = document.getElementById('appToast'); if (!el) return; el.querySelector('.toast-body').textContent = message; bootstrap.Toast.getOrCreateInstance(el).show(); };
  const setTheme = dark => { body.classList.toggle('dark-mode', dark); localStorage.setItem('parcelpro-dashboard-theme', dark ? 'dark' : 'light'); document.querySelectorAll('[data-theme-toggle]').forEach(x => x.checked = dark); };
  setTheme(localStorage.getItem('parcelpro-dashboard-theme') === 'dark');
  document.querySelectorAll('[data-sidebar-toggle]').forEach(btn => btn.addEventListener('click', () => { sidebar.classList.toggle('show'); backdrop.classList.toggle('show'); }));
  backdrop?.addEventListener('click', () => { sidebar.classList.remove('show'); backdrop.classList.remove('show'); });
  document.querySelectorAll('[data-theme-toggle]').forEach(toggle => toggle.addEventListener('change', e => { setTheme(e.target.checked); showToast(e.target.checked ? 'Dark mode enabled.' : 'Light mode enabled.'); }));
  document.querySelectorAll('[data-table-search]').forEach(input => input.addEventListener('input', () => document.querySelectorAll(input.dataset.tableSearch + ' tbody tr').forEach(row => row.hidden = !row.textContent.toLowerCase().includes(input.value.toLowerCase()))));
  document.querySelectorAll('[data-password-toggle]').forEach(btn => btn.addEventListener('click', () => { const input = document.querySelector(btn.dataset.passwordToggle); input.type = input.type === 'password' ? 'text' : 'password'; btn.querySelector('i').classList.toggle('bi-eye'); btn.querySelector('i').classList.toggle('bi-eye-slash'); }));
  document.querySelectorAll('form[data-form]').forEach(form => form.addEventListener('submit', event => { event.preventDefault(); if (!form.checkValidity()) { form.classList.add('was-validated'); return; } const action = form.dataset.form; if (action === 'book') { form.reset(); showToast('Parcel request submitted successfully.'); } else if (action === 'profile') showToast('Profile updated successfully.'); else if (action === 'password') { form.reset(); showToast('Password changed successfully.'); } else showToast('Changes saved successfully.'); }));
  document.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => { if (confirm('Delete this order? This action cannot be undone.')) { btn.closest('tr').remove(); showToast('Order deleted.'); } }));
  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => { document.getElementById('editOrderId').value = btn.dataset.edit; document.getElementById('editCustomer').value = btn.dataset.customer; bootstrap.Modal.getOrCreateInstance(document.getElementById('editOrderModal')).show(); }));
  document.getElementById('editOrderForm')?.addEventListener('submit', event => { event.preventDefault(); bootstrap.Modal.getInstance(document.getElementById('editOrderModal')).hide(); showToast('Order updated successfully.'); });
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', () => { if (confirm('Are you sure you want to log out?')) { showToast('Logged out. Returning to sign in…'); setTimeout(() => location.href = '../login.html', 550); } }));
  document.querySelectorAll('[data-toast]').forEach(btn => btn.addEventListener('click', () => showToast(btn.dataset.toast)));
});
