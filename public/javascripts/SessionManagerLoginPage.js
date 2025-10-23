new Vue({
    el: '#app',
    data: {
        isLoggedIn: false, // Assume initially not logged in
        sessionInfo: null
    },
    mounted() {
        // Check if the user is logged in (check for userID in localStorage)
        this.isLoggedIn = !!localStorage.getItem('userID');
        this.fetchSessionInfo();
    },
    methods: {
        async login(event) {
            event.preventDefault();
            const form = (event && event.target && event.target.closest) ? event.target.closest('form') : document.getElementById('login-signup-form');
            if (form && !form.reportValidity()) {
                return;
            }
            const username = document.getElementById('login-signup-username').value;
            const password = document.getElementById('login-signup-password').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: username, password: password })
                });

                if (!response.ok) {
                    throw new Error('Login failed');
                }

                const data = await response.json();
                localStorage.setItem('userID', data.userID); // Save the userID in local storage
                this.isLoggedIn = true; // Update the login state
                window.location.href = data.redirect || '/index.html'; // Redirect after login
            } catch (error) {
                alert('Login failed');
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