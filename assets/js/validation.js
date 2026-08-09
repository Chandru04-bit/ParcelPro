/* ========== ParcelPro - Form Validation JavaScript ========== */

(function () {
  'use strict';

  const RULES = {
    required: (v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    },
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: (v) => /^[\d\s+()\-]{7,20}$/.test(v.trim()),
    min: (v, n) => String(v).trim().length >= parseInt(n, 10),
    max: (v, n) => String(v).trim().length <= parseInt(n, 10),
    minValue: (v, n) => parseFloat(v) >= parseFloat(n),
    maxValue: (v, n) => parseFloat(v) <= parseFloat(n),
    match: (v, sel) => {
      const target = document.querySelector(sel);
      return target && String(v) === String(target.value);
    },
    tracking: (v) => /^[A-Za-z0-9]{8,20}$/.test(v.trim()),
    postal: (v) => /^[\w\s-]{3,12}$/.test(v.trim()),
    url: (v) => {
      try { new URL(v); return true; } catch (_) { return false; }
    },
    number: (v) => !isNaN(parseFloat(v)) && isFinite(v),
    integer: (v) => /^-?\d+$/.test(String(v).trim()),
    pattern: (v, p) => new RegExp(p).test(v),
    zipUS: (v) => /^\d{5}(-\d{4})?$/.test(v.trim()),
    strongPassword: (v) => {
      const s = String(v);
      return s.length >= 8 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s);
    },
    checkbox: (el) => el && el.checked === true
  };

  const MESSAGES = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    min: (n) => `Minimum ${n} characters required`,
    max: (n) => `Maximum ${n} characters allowed`,
    minValue: (n) => `Value must be at least ${n}`,
    maxValue: (n) => `Value must be at most ${n}`,
    match: 'Values do not match',
    tracking: 'Tracking number should be 8-20 alphanumeric characters',
    postal: 'Please enter a valid postal/zip code',
    url: 'Please enter a valid URL',
    number: 'Please enter a valid number',
    integer: 'Please enter a whole number',
    zipUS: 'Please enter a valid ZIP code (e.g. 12345 or 12345-6789)',
    strongPassword: 'Password must be 8+ chars with uppercase, lowercase, and number',
    checkbox: 'You must agree to continue'
  };

  window.ParcelProValidate = {
    validate,
    validateField,
    initAll,
    RULES,
    MESSAGES,
    validateFormGroup,
    showError,
    showSuccess,
    resetField
  };

  document.addEventListener('DOMContentLoaded', initAll);

  function initAll() {
    document.querySelectorAll('form[data-validate="true"]').forEach(f => initForm(f));
    document.querySelectorAll('[data-validate-field]').forEach(el => {
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => {
        if (hasError(el)) validateField(el);
      });
    });
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', togglePasswordVisibility);
    });
  }

  function initForm(form) {
    form.setAttribute('novalidate', 'true');
    const fields = form.querySelectorAll('[data-rules], [name]');
    fields.forEach(f => {
      f.addEventListener('blur', () => validateField(f));
      f.addEventListener('change', () => validateField(f));
      f.addEventListener('input', () => {
        if (hasError(f)) validateField(f);
      });
    });

    form.addEventListener('submit', (e) => {
      const valid = validate(form);
      if (!valid) {
        e.preventDefault();
        const firstError = form.querySelector('.pp-field-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => firstError.focus(), 400);
        }
      } else if (form.getAttribute('data-on-success')) {
        const fn = form.getAttribute('data-on-success');
        if (typeof window[fn] === 'function') {
          e.preventDefault();
          window[fn](form);
        }
      }
    });
  }

  function validate(form) {
    let valid = true;
    const fields = form.querySelectorAll('[data-rules], [name][required]');
    fields.forEach(f => {
      if (!validateField(f)) valid = false;
    });
    return valid;
  }

  function validateField(el) {
    const ruleStr = el.getAttribute('data-rules') || defaultRules(el);
    if (!ruleStr && !el.hasAttribute('required')) return true;
    const rules = parseRules(ruleStr);
    if (el.hasAttribute('required')) rules.unshift(['required']);

    let value = el.type === 'checkbox' ? el : (el.value || '');
    const formGroup = el.closest('.form-group') || el.parentElement;
    let errorMsg = '';

    for (const [name, ...params] of rules) {
      const rule = RULES[name];
      if (!rule) continue;
      const passed = name === 'checkbox' ? rule(el) : rule(value, ...params);
      if (!passed) {
        const customMsg = el.getAttribute(`data-msg-${name}`);
        errorMsg = customMsg || formatMessage(MESSAGES[name], params);
        break;
      }
    }

    if (errorMsg) {
      showError(el, errorMsg, formGroup);
      return false;
    } else {
      showSuccess(el, formGroup);
      return true;
    }
  }

  function defaultRules(el) {
    const t = el.type || el.tagName.toLowerCase();
    const rules = [];
    if (el.type === 'email') rules.push('email');
    if (el.name?.toLowerCase().includes('phone')) rules.push('phone');
    if (el.name?.toLowerCase().includes('tracking')) rules.push('tracking');
    if (el.name?.toLowerCase().includes('zip') || el.name?.toLowerCase().includes('postal')) rules.push('postal');
    return rules.join('|');
  }

  function parseRules(str) {
    if (!str) return [];
    return str.split('|').map(r => {
      const [name, params] = r.split(':');
      return [name, ...(params ? params.split(',') : [])];
    });
  }

  function formatMessage(msg, params) {
    if (typeof msg === 'function') return msg(...params);
    if (params.length) {
      params.forEach((p, i) => { msg = msg.replace(new RegExp(`\\$${i + 1}`, 'g'), p); });
    }
    return msg;
  }

  function showError(el, msg, formGroup) {
    const container = formGroup || el.closest('.form-group') || el.parentElement;
    let errEl = container.querySelector('.pp-error-msg');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'pp-error-msg';
      errEl.style.cssText = `
        color: #ef4444; font-size: 12px; margin-top: 6px;
        display: flex; align-items: center; gap: 4px;
      `;
      container.appendChild(errEl);
    }
    errEl.innerHTML = `<i class="bi bi-exclamation-circle"></i> <span>${msg}</span>`;
    el.classList.add('pp-field-error');
    el.style.borderColor = '#ef4444';
    el.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
    const successIcon = container.querySelector('.pp-success-icon');
    if (successIcon) successIcon.remove();
  }

  function showSuccess(el, formGroup) {
    const container = formGroup || el.closest('.form-group') || el.parentElement;
    const errEl = container.querySelector('.pp-error-msg');
    if (errEl) errEl.remove();
    el.classList.remove('pp-field-error');
    el.style.borderColor = '';
    el.style.boxShadow = '';
    if (el.getAttribute('data-show-success') !== 'false' && el.value?.trim()) {
      if (!container.querySelector('.pp-success-icon')) {
        const i = document.createElement('i');
        i.className = 'bi bi-check-circle-fill pp-success-icon';
        i.style.cssText = `
          position: absolute; right: 14px; top: 50%;
          transform: translateY(calc(-50% + 12px));
          color: #10b981; font-size: 16px; pointer-events: none;
        `;
        container.style.position = 'relative';
        container.appendChild(i);
      }
    }
  }

  function resetField(el) {
    const container = el.closest('.form-group') || el.parentElement;
    const errEl = container.querySelector('.pp-error-msg');
    const okIcon = container.querySelector('.pp-success-icon');
    if (errEl) errEl.remove();
    if (okIcon) okIcon.remove();
    el.classList.remove('pp-field-error');
    el.style.borderColor = '';
    el.style.boxShadow = '';
  }

  function hasError(el) {
    const container = el.closest('.form-group') || el.parentElement;
    return container?.querySelector('.pp-error-msg') || el.classList.contains('pp-field-error');
  }

  function validateFormGroup(groupEl) {
    const fields = groupEl.querySelectorAll('[data-rules], [name]');
    let valid = true;
    fields.forEach(f => { if (!validateField(f)) valid = false; });
    return valid;
  }

  function togglePasswordVisibility(e) {
    const btn = e.currentTarget;
    const input = btn.closest('.password-wrap')?.querySelector('input')
      || document.getElementById(btn.getAttribute('data-target'));
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    const icon = btn.querySelector('i') || btn;
    icon.className = icon.className.replace(/bi-[\w-]+/g, '') + ' ' + (isHidden ? 'bi-eye-slash' : 'bi-eye');
  }

  window.showToast = function (msg, type = 'success', duration = 3500) {
    const colors = {
      success: { bg: '#10b981', icon: 'bi-check-circle' },
      error: { bg: '#ef4444', icon: 'bi-x-circle' },
      warning: { bg: '#f59e0b', icon: 'bi-exclamation-triangle' },
      info: { bg: '#06b6d4', icon: 'bi-info-circle' }
    };
    const c = colors[type] || colors.success;
    let container = document.getElementById('ppToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ppToastContainer';
      container.style.cssText = `
        position: fixed; top: 24px; right: 24px; z-index: 9999;
        display: flex; flex-direction: column; gap: 10px;
      `;
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #fff; border-radius: 14px; padding: 14px 18px;
      display: flex; align-items: center; gap: 12px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.15);
      min-width: 300px; max-width: 420px;
      border-left: 4px solid ${c.bg};
      animation: fadeInLeft 0.3s ease-out;
    `;
    toast.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 10px;
        background: ${c.bg}15; color: ${c.bg}; display: flex;
        align-items: center; justify-content: center; flex-shrink: 0;">
        <i class="bi ${c.icon}"></i>
      </div>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #1e293b; font-size: 14px; text-transform: capitalize;">${type}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">${msg}</div>
      </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeInLeft 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(styleTag);

})();
