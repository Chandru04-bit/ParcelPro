/* Client-side account and session management for this demo application. */
window.ParcelProAuth = (() => {
  const USERS_KEY = 'parcelpro-users';
  const SESSION_KEY = 'parcelpro-session';
  const USERNAME_KEY = 'username';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const readTemporary = (key, fallback) => { try { return JSON.parse(sessionStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const normaliseEmail = email => String(email || '').trim().toLowerCase();

  function users() { return read(USERS_KEY, []); }
  function session() { return read(SESSION_KEY, null) || readTemporary(`${SESSION_KEY}-temporary`, null); }
  function saveSession(value, remember = true) {
    const temporaryKey = `${SESSION_KEY}-temporary`;
    if (remember) { write(SESSION_KEY, value); sessionStorage.removeItem(temporaryKey); }
    else { sessionStorage.setItem(temporaryKey, JSON.stringify(value)); localStorage.removeItem(SESSION_KEY); }
  }

  function register(data) {
    const email = normaliseEmail(data.email);
    const name = String(data.name || '').trim();
    const password = String(data.password || '');
    if (!name || !email || !password) return { ok: false, message: 'Please complete all required fields.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Please enter a valid email address.' };
    if (password.length < 8) return { ok: false, message: 'Password must contain at least 8 characters.' };
    if (users().some(user => user.email === email)) return { ok: false, message: 'An account with this email already exists.' };
    const user = { id: `USR-${Date.now()}`, name, email, phone: String(data.phone || '').trim(), password, role: 'user', createdAt: new Date().toISOString() };
    write(USERS_KEY, [...users(), user]);
    return { ok: true, user };
  }

  function login(email, password, remember = true) {
    email = normaliseEmail(email);
    const user = users().find(entry => entry.email === email);
    if (!user) return { ok: false, message: 'No account found. Please register before signing in.' };
    if (user.password !== password) return { ok: false, message: 'Incorrect email or password.' };
    const activeUser = { id: user.id, email: user.email, name: user.name, role: 'user' };
    saveSession(activeUser, remember);
    localStorage.setItem(USERNAME_KEY, activeUser.name);
    return { ok: true, role: 'user', user: activeUser };
  }

  function requireRole(role) {
    const active = session();
    if (!active || active.role !== role) {
      location.replace('../login.html');
      return null;
    }
    return active;
  }

  function logout() {
    const isDashboardPage = /\/customer-dashboard\//.test(location.pathname);
    const redirect = isDashboardPage ? '../login.html' : 'login.html';
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(`${SESSION_KEY}-temporary`);
    location.href = redirect;
  }

  function resetPassword(email, currentPassword, newPassword) {
    const normalised = normaliseEmail(email);
    const all = users();
    const index = all.findIndex(user => user.email === normalised);
    if (index < 0) return false;
    if (all[index].password !== currentPassword) return false;
    all[index].password = newPassword;
    write(USERS_KEY, all);
    return true;
  }

  function updateUser(id, changes) {
    const all = users();
    const index = all.findIndex(user => user.id === id);
    if (index < 0) return null;
    all[index] = { ...all[index], ...changes, email: normaliseEmail(changes.email || all[index].email) };
    write(USERS_KEY, all);
    saveSession({ id: all[index].id, name: all[index].name, email: all[index].email, role: 'user' });
    localStorage.setItem(USERNAME_KEY, all[index].name);
    return all[index];
  }

  function deleteUser(id) { write(USERS_KEY, users().filter(user => user.id !== id)); }
  function username() { return String(localStorage.getItem(USERNAME_KEY) || '').trim(); }

  return { users, session, username, register, login, requireRole, logout, resetPassword, updateUser, deleteUser };
})();
