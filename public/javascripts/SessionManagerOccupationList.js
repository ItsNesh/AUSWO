new Vue({
	el: '#app',
	data: {
		isLoggedIn: false,
		sessionInfo: null,
		isAdmin: false,
		selectedList: 'MLTSSL',
		occupations: [],
		loading: false,
		error: null
	},
	mounted() {
		this.checkLoginState();
		this.fetchOccupations();
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
		async fetchOccupations() {
		  this.loading = true;
		  this.error = null;

		  try {
			const response = await fetch(`/api/occupations/${this.selectedList}`);

			if (!response.ok) {
			  throw new Error(`Failed to fetch occupations: ${response.statusText}`);
			}

			const data = await response.json();
			this.occupations = data;
		  } catch (err) {
			console.error('Error fetching occupations:', err);
			this.error = 'Failed to load occupations. Please try again later.';
			this.occupations = [];
		  } finally {
			this.loading = false;
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