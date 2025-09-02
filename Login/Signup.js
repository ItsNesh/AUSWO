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
    const email = document.getElementById('login-signup-email')?.value?.trim() || null;
    const password = document.getElementById('login-signup-password')?.value || '';
    const repeatPassword = document.getElementById('login-signup-repeat-password')?.value || '';

    if (!firstName || !lastName || !email || !password || !repeatPassword) {
      setMessage('Please fill in all fields.', 'error');
      return;
    }
    if (password !== repeatPassword) {
      setMessage('Passwords do not match.', 'error');
      return;
    }

    // Server expects: firstName, lastName, phoneNumber, email, userName, passwordHash
    // Sending null for fields we don't use yet don't forget to change this later!
    const payload = {
      firstName,
      lastName,
      phoneNumber: null,
      email,
      userName: null,
      passwordHash: password
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error || 'Failed to sign up.', 'error');
        return;
      }
      setMessage('Account created successfully!', 'success');
      // Could make this redirect to login
    } catch (err) {
      setMessage('Network error during signup.', 'error');
      console.error(err);
    }
  });
})();
