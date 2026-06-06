(() => {
  const CONTACT_API = {
    version: 1,
    endpoint: '/api/v1/contact',
  };

  const form = document.getElementById('contactForm');
  if (!form) return;

  const config = window.CONTACT_PUBLIC_CONFIG || {};
  const siteKey = config.TURNSTILE_SITE_KEY || '';
  const hasSiteKey = siteKey && !siteKey.includes('REPLACE_WITH');
  const endpoint = form.dataset.contactEndpoint || CONTACT_API.endpoint;
  const submitBtn = document.getElementById('submitBtn');
  const turnstileHost = document.getElementById('contactTurnstile');

  let turnstileWidgetId = null;
  let turnstileToken = '';

  function notify(message, type = 'error') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMsg');
    if (toast && toastIcon && toastMessage) {
      toastIcon.textContent = type === 'error' ? '✕' : '✓';
      toastMessage.textContent = message;
      toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'} show`;
      window.setTimeout(() => toast.classList.remove('show'), 5000);
      return;
    }

    console[type === 'error' ? 'error' : 'log'](message);
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.dataset.originalText ||= submitBtn.innerHTML;
    submitBtn.innerHTML = isLoading ? 'Transmitting...' : submitBtn.dataset.originalText;
  }

  function setFieldValidity(field, valid) {
    const wrapper = field.closest('.form-field');
    field.toggleAttribute('aria-invalid', !valid);
    if (wrapper) wrapper.classList.toggle('error', !valid);
  }

  function validateField(field) {
    const value = field.value.trim();
    let valid = true;

    if (field.required && !value) {
      valid = false;
    } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      valid = false;
    } else if (field.minLength > 0 && value.length < field.minLength) {
      valid = false;
    } else if (field.maxLength > 0 && value.length > field.maxLength) {
      valid = false;
    }

    setFieldValidity(field, valid);
    return valid;
  }

  function getPayload() {
    return {
      name: form.from_name.value.trim(),
      email: form.from_email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
      website: form.website ? form.website.value.trim() : '',
    };
  }

  function resetTurnstile() {
    turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }

  function renderTurnstile() {
    if (!turnstileHost || !hasSiteKey) return;

    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      window.setTimeout(renderTurnstile, 150);
      return;
    }

    turnstileWidgetId = window.turnstile.render(turnstileHost, {
      sitekey: siteKey,
      theme: 'light',
      callback(token) {
        turnstileToken = token;
      },
      'expired-callback'() {
        turnstileToken = '';
      },
      'error-callback'() {
        turnstileToken = '';
        notify('Verification failed to load. Refresh and try again.', 'error');
      },
    });
  }

  form.querySelectorAll('input[required], textarea[required]').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      const wrapper = field.closest('.form-field');
      if (wrapper && wrapper.classList.contains('error')) validateField(field);
    });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const requiredFields = [form.from_name, form.from_email, form.message];
    const isValid = requiredFields.every(validateField);
    if (!isValid) {
      notify('Please fix the highlighted fields.', 'error');
      return;
    }

    if (!hasSiteKey) {
      notify('Contact verification is not configured yet.', 'error');
      return;
    }

    if (!turnstileToken) {
      notify('Complete the verification before sending.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: CONTACT_API.version,
          turnstileToken,
          payload: getPayload(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        const messages = {
          VALIDATION_ERROR: data.errors?.[0] || 'Check the form fields and try again.',
          BOT_FAILED: 'Verification failed. Refresh and try again.',
          RATE_LIMITED: 'Too many attempts. Try again in a minute.',
          SERVER_ERROR: 'Signal failed on the server. Try again later.',
        };
        notify(messages[data.code] || 'Message could not be sent.', 'error');
        resetTurnstile();
        return;
      }

      form.reset();
      form.querySelectorAll('.form-field').forEach(field => field.classList.remove('error'));
      notify(data.message || "Signal received. I'll be in touch soon.", 'success');
      resetTurnstile();
    } catch (error) {
      console.error('Contact submit failed:', error);
      notify('Network error. Try again in a moment.', 'error');
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  });

  renderTurnstile();
})();
