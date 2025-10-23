// Helper function to escape HTML special characters
function escapeHTML(str = '') {
    if (typeof str !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    
    return str.replace(/[&<>"']/g, char => map[char]);
}

function toggleDropdown() {
    const menu = document.getElementById("dropdownMenu");
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function editProfile() {
    const content = document.getElementById("main-content");
    const profile = window.currentUserProfile || {};
    const nameFromDom = document.getElementById("userName").innerText;
    const emailFromDom = document.getElementById("userEmail").innerText;

    const currentName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || nameFromDom || '';
    const currentEmail = profile.email || emailFromDom || '';
    const currentUserName = profile.userName || '';
    const currentPhone = profile.phoneNumber || '';

    content.innerHTML = `
        <form id="profile-edit-form" class="profile-edit-form">
            <h2>Edit Profile</h2>
            <label>Name: <input type="text" id="editName" value="${escapeHTML(currentName)}" required></label><br><br>
            <label>Username: <input type="text" id="editUsername" value="${escapeHTML(currentUserName)}" required></label><br><br>
            <label>Email: <input type="email" id="editEmail" value="${escapeHTML(currentEmail)}" required></label><br><br>
            <label>Phone: <input type="tel" id="editPhone" value="${escapeHTML(currentPhone)}"></label><br><br>
            <button class="button" type="button" onclick="saveProfile()">Save</button>
            <button class="button" type="button" style="margin-left:8px;" onclick="cancelEdit()">Cancel</button>
        </form>
    `;

    const form = document.getElementById('profile-edit-form');
    if (form && window.AUSWOFormValidation) {
        window.AUSWOFormValidation.attachCustomValidity(form, {
            'editName': 'Please enter your name.',
            'editUsername': 'Please enter your username.',
            'editEmail': 'Please enter a valid email address.',
        });
    }
}

async function saveProfile() {
    const form = document.getElementById('profile-edit-form');
    if (form && !form.reportValidity()) {
        return;
    }
    const newName = document.getElementById("editName").value || '';
    const newEmail = document.getElementById("editEmail").value || '';
    const newUserName = document.getElementById("editUsername").value || '';
    const newPhone = document.getElementById("editPhone").value || '';

    const parts = newName.trim().split(/\s+/);
    const firstName = parts.shift() || '';
    const lastName = parts.join(' ');

    const userID = localStorage.getItem('userID');
    const content = document.getElementById("main-content");
    if (!userID) {
        content.innerHTML = `
            <h2>Not Logged In</h2>
            <p>Please log in to update your profile.</p>
        `;
        return;
    }

    try {
        const res = await fetch(`/api/users/${encodeURIComponent(userID)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                email: newEmail,
                userName: newUserName,
                phoneNumber: newPhone,
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const msg = err && err.error ? err.error : 'Failed to update profile';
            content.innerHTML = `
                <h2>Update Failed</h2>
                <p>${escapeHTML(msg)}</p>
            `;
            return;
        }

        const updated = await res.json().catch(() => null);
        const displayName = [updated?.firstName || firstName, updated?.lastName || lastName].filter(Boolean).join(' ') || newName;

        document.getElementById("userName").innerText = displayName;
        document.getElementById("userEmail").innerText = (updated && updated.email) || newEmail;
        window.currentUserProfile = Object.assign({}, window.currentUserProfile || {}, updated || {
            firstName, lastName, email: newEmail, userName: newUserName, phoneNumber: newPhone
        });

        content.innerHTML = `
            <h2>Profile Updated</h2>
            <p>Your changes have been saved.</p>
        `;
    } catch (e) {
        console.error(e);
        content.innerHTML = `
            <h2>Error</h2>
            <p>There was an error updating your profile.</p>
        `;
    }
}

function cancelEdit() {
    const content = document.getElementById('main-content');
    const fallback = (typeof window.defaultMainContent !== 'undefined')
        ? window.defaultMainContent
        : 'Welcome to your New Profile Page!';
    if (content) content.innerHTML = fallback;
}

async function resolveVisaName(value) {
    if (!value) return 'N/A';
    if (!/^\d+$/.test(String(value))) return String(value);
    const code = String(value);
    try {
        const res = await fetch('/points_calculator_logic.json', { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return `Subclass ${code}`;
        const data = await res.json();
        const visas = Array.isArray(data?.visas) ? data.visas : [];
        const found = visas.find(v => String(v.id) === code);
        return found?.name || `Subclass ${code}`;
    } catch {
        return `Subclass ${code}`;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const usernameEl = document.getElementById('userUsername');
    const phoneEl = document.getElementById('userPhone');
    const pointsEl = document.getElementById('points-content');
    const mainContentEl = document.getElementById('main-content');
    try { if (mainContentEl && typeof window.defaultMainContent === 'undefined') window.defaultMainContent = mainContentEl.innerHTML; } catch {}

    try {
        const userID = localStorage.getItem('userID');
        if (!userID) {
            nameEl.textContent = 'Not logged in';
            emailEl.textContent = '';
            pointsEl.textContent = 'Not logged in.';
            return;
        }

        const res = await fetch(`/api/users/${encodeURIComponent(userID)}`);
        if (!res.ok) {
            nameEl.textContent = 'Error loading profile';
            pointsEl.textContent = 'Failed to load profile data.';
            return;
        }
        const u = await res.json();
        const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || 'User';
        nameEl.textContent = displayName;
        emailEl.textContent = u.email || '';
        if (usernameEl) usernameEl.textContent = u.userName ? `Username: ${escapeHTML(u.userName)}` : '';
        if (phoneEl) phoneEl.textContent = u.phoneNumber ? `Phone: ${escapeHTML(u.phoneNumber)}` : '';
        try { window.currentUserProfile = u; } catch {}

        const pts = (typeof u.visaPoints === 'number') ? u.visaPoints : 'N/A';
        const visaName = await resolveVisaName(u.visaOption);
        if (pointsEl) pointsEl.innerHTML = `
          <p>Visa Option: <strong>${escapeHTML(visaName)}</strong></p>
          <p>Total Points: <strong>${pts}</strong></p>
          <a href="/points-calculator.html">Update your points</a>
        `;
    } catch (e) {
        console.error(e);
        nameEl.textContent = 'Error';
        if (pointsEl) pointsEl.textContent = 'Error loading profile information';
    }
});
