// Login form handler
(() => {
  const form = document.getElementById('login-signup-form');
  if (!form) return;

  const ensureMessageEl = () => {
    let el = document.getElementById('login-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'login-message';
      el.style.marginTop = '10px';
      form.appendChild(el);
    }
    return el;
  };

  const setMessage = (text, type = 'info') => {
    const el = ensureMessageEl();
    el.textContent = text;
    el.style.color = type === 'error' ? '#b00020' : type === 'success' ? '#0a7d00' : '#333';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMessage('Signing in...', 'info');

    const email = document.getElementById('login-signup-email')?.value?.trim();
    const password = document.getElementById('login-signup-password')?.value || '';

    if (!email || !password) {
      setMessage('Please enter email and password.', 'error');
      return;
    }

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data?.errors?.[0]?.msg || data?.error || 'Login failed.';
        setMessage(errorMsg, 'error');
        return;
      }

      setMessage('Login successful!', 'success');
      // Redirect to profile or wherever the server specifies
      if (data.redirect) {
        setTimeout(() => window.location.href = data.redirect, 500);
      }
    } catch (err) {
      setMessage('Network error during login.', 'error');
      console.error(err);
    }
  });
})();
