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
        async sendContactMessage(event) {
            event.preventDefault();
            // Clear previous errors
            this.errors.general = '';

            const payload = {
                topic: document.getElementById('content-topic').value,
                messageBody: document.getElementById('content-message').value
            };

            // If user is not logged in, include guest details
            if (!this.isLoggedIn) {
                payload.guestfirstName = document.getElementById('guestfirstName').value;
                payload.guestlastName = document.getElementById('guestlastName').value;
                payload.guestEmail = document.getElementById('guestEmail').value;
            }
            

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
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
                        this.errors.general = result.error || 'Sending Contact Message failed. Please try again.';
                    }
                    return;
                }

                alert('Message sent successfully!');
                document.getElementById('contact-form').reset();
            } catch (error) {
                console.error('Error sending message:', error);
                this.errors.general = 'Failed to send message. Please try again.';
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