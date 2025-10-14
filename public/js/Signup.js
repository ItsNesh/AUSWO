// Signup form handler
(() => {
  const form = document.getElementById('login-signup-form');
  if (!form) return;

  const ensureMessageEl = () => {
    let el = document.getElementById('signup-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'signup-message';
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
    setMessage('Creating account...', 'info');

    const firstName = document.getElementById('login-signup-first-name')?.value?.trim() || null;
    const lastName = document.getElementById('login-signup-last-name')?.value?.trim() || null;
    const phoneNumber = document.getElementById('login-signup-phonenumber')?.value?.trim() || null;
    const email = document.getElementById('login-signup-email')?.value?.trim() || null;
    const password = document.getElementById('login-signup-password')?.value || '';
    const repeatPassword = document.getElementById('login-signup-repeat-password')?.value || '';

    if (!firstName || !lastName || !phoneNumber || !email || !password || !repeatPassword) {
      setMessage('Please fill in all fields.', 'error');
      return;
    }
    if (password !== repeatPassword) {
      setMessage('Passwords do not match.', 'error');
      return;
    }

    const payload = {
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      confirmPassword: repeatPassword
    };

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data?.errors?.[0]?.msg || data?.error || 'Failed to sign up.';
        setMessage(errorMsg, 'error');
        return;
      }
      setMessage('Account created successfully! Redirecting...', 'success');
      // Redirect to login page after successful signup
      if (data.redirect) {
        setTimeout(() => window.location.href = data.redirect, 1000);
      }
    } catch (err) {
      setMessage('Network error during signup.', 'error');
      console.error(err);
    }
  });
})();
