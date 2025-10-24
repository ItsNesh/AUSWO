new Vue({
    el: '#app',
    data: {
        isLoggedIn: false,
        sessionInfo: null,
        isAdmin: false,
    },
    mounted() {
        this.checkLoginState();
    },
    methods: {
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