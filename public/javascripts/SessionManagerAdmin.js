new Vue({
    el: '#app',
    data: {
        isLoggedIn: false,
        sessionInfo: null,
        isAdmin: false,
        users: [],
        loading: true,
        error: null
    },
    mounted() {
        this.checkLoginState();
        this.fetchUsers();
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
        async fetchUsers() {
            this.loading = true;
            this.error = null;

            try {
                const response = await fetch('/admin/all');

                if (response.status === 403) {
                    this.error = 'Access denied. You do not have permission to view this page.';
                    this.isAdmin = false;
                    return;
                }

                if (!response.ok) throw new Error('Failed to fetch users');

                const data = await response.json();
                this.users = data.users;
            } catch (error) {
                console.error('Error fetching users:', error);
                this.error = 'An error occurred while fetching users. Please refresh the page or try again later.';
            } finally {
                this.loading = false;
            }
        },
        async removeUser(user) {
            if (!confirm(`Are you sure you want to remove ${user.name}?`)) {
                return;
            }
            try {
                const response = await fetch(`/admin/${user.id}`, {
                    method: 'DELETE'
                });

                if (response.status === 403) {
                    alert('Access denied. You do not have permission to perform this action.');
                    return;
                }

                if (!response.ok) throw new Error('Failed to remove user');

                this.users = this.users.filter(u => u.id !== user.id);
                alert('User removed successfully');
            } catch (error) {
                console.error('Error removing user:', error);
                alert('Failed to remove user. Please try again.');
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