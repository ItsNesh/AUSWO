new Vue({
    el: '#app',
    data: {
        isLoggedIn: false,
        sessionInfo: null,
        isAdmin: false,
        errors: {
            general: ''
        }
    },
    mounted() {
        this.checkLoginState();
    },
    methods: {
        clearError(field) {
            if (field === 'general') {
                this.errors.general = '';
            }
        },
        async register(event) {
            event.preventDefault();

            const firstName = document.getElementById('login-signup-first-name').value;
            const lastName = document.getElementById('login-signup-last-name').value;
            const phoneNumber = document.getElementById('login-signup-phonenumber').value;
            const email = document.getElementById('login-signup-email').value;
            const userName = document.getElementById('login-signup-username').value;
            const password = document.getElementById('login-signup-password').value;
            const confirmPassword = document.getElementById('login-signup-repeat-password').value;

            // Clear previous errors
            this.errors.general = '';

            // Client-side validation
            if (password !== confirmPassword) {
                this.errors.general = 'Passwords do not match.';
                return;
            }

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        phoneNumber,
                        email,
                        userName,
                        password,
                        confirmPassword,
                    }),
                });

                const result = await response.json();

                if (response.status !== 201) {
                    // Handle validation errors from backend
                    if (result.errors && Array.isArray(result.errors)) {
                        // Collect all error messages
                        const errorMessages = result.errors.map(error => error.msg);
                        this.errors.general = errorMessages.join('\n');
                    } else {
                        // Fallback for unexpected error format
                        this.errors.general = result.error || 'Registration failed. Please try again.';
                    }
                    return;
                }

                // Redirect on success
                if (result.redirect) {
                    window.location.href = result.redirect;
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.errors.general = 'An unexpected error occurred. Please try again.';
            }
        },
        async checkLoginState() {
            try {
                const response = await fetch('/auth/session-info');
                if (!response.ok) throw new Error('Failed to fetch session info');
                const data = await response.json();
                this.isLoggedIn = data.isLoggedIn;
                this.sessionInfo = data;
                this.isAdmin = data.isAdmin;

                // Sync localStorage with session for OAuth
                if (data.isLoggedIn && data.userId) {
                    localStorage.setItem('userID', data.userId);
                    const currentUserID = localStorage.getItem('userID');
                    if (currentUserID && currentUserID !== String(data.userId)) {
                        window.location.reload();
                    }
                } else if (!data.isLoggedIn) {
                    localStorage.removeItem('userID');
                }
            } catch (error) {
                console.error('Error fetching session info:', error);
                this.sessionInfo = 'No session information available';
            }
        },
        logout() {
            fetch('/auth/logout')
                .then(response => {
                    if (response.ok) {
                        localStorage.removeItem('token');
                        this.isLoggedIn = false;
                        this.isAdmin = false;
                        window.location.href = '/Login.html';
                    } else {
                        throw new Error('Logout failed');
                    }
                })
                .catch(error => {
                    console.error('Error logging out:', error);
                });
        }
    }
});