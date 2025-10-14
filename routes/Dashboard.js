var express = require('express');
var router = express.Router();

async function loadDashboardContent() {
    try {
        const response = await fetch('Dashboard.json');
        const data = await response.json();
        const container = document.getElementById('dashboard-content');
        container.innerHTML = '';

        data.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = item.text;

        if (item.link) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = item.link;
            });
        }
        container.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading dashboard content:', err);
    }
}
loadDashboardContent();

module.exports = router;