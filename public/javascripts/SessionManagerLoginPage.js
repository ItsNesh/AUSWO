new Vue({
    el: '#app',
    data: {
        isLoggedIn: false, // Assume initially not logged in
        sessionInfo: null,
        errors: {
            general: ''
        }
    },
    mounted() {
        // Check if the user is logged in (check for userID in localStorage)
        this.isLoggedIn = !!localStorage.getItem('userID');
        this.fetchSessionInfo();
    },
    methods: {
        clearError(field) {
            if (field === 'general') {
                this.errors.general = '';
            }
        },
        async login(event) {
            event.preventDefault();
            const username = document.getElementById('login-signup-username').value;
            const password = document.getElementById('login-signup-password').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: username, password: password })
                });

                const data = await response.json();

                console.log('Response status:', response.status);
                console.log('Response data:', data);

                if (!response.ok) {
                    // Handle validation errors from backend
                    if (data.errors && Array.isArray(data.errors)) {
                        console.log('Processing errors:', data.errors);
                        // Collect all error messages
                        const errorMessages = data.errors.map(error => error.msg);
                        this.errors.general = errorMessages.join('. ');
                        console.log('Final errors object:', this.errors);
                    } else {
                        // Fallback for unexpected error format
                        this.errors.general = 'Login failed. Please check your credentials.';
                    }
                    return;
                }

                localStorage.setItem('userID', data.userID); // Save the userID in local storage
                this.isLoggedIn = true; // Update the login state
                window.location.href = data.redirect || '/index.html'; // Redirect after login
            } catch (error) {
                console.error('Login error:', error);
                this.errors.general = 'An unexpected error occurred. Please try again.';
            }
        },
        loginWithGoogle() {
            window.location.href = '/auth/google';
        },
        logout() {
            // Remove the userID from localStorage
            localStorage.removeItem('userID');
            // Set the logged-in state to false
            this.isLoggedIn = false;
            // Redirect to the homepage or login page
            window.location.href = '/Login.html';
        },
        async fetchSessionInfo() {
            try {
                const response = await fetch('/auth/session-info');
                if (!response.ok) throw new Error('Failed to fetch session info');
                const data = await response.json();
                this.sessionInfo = data;
            } catch (error) {
                console.error('Error fetching session info:', error);
                this.sessionInfo = 'No session information available';
            }
        }
    }
});