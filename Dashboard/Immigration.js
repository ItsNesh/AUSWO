async function loadImmigration() {
    try {
        const response = await fetch('Immigration.json');
        const data = await response.json();
        const container = document.getElementById('immigration-content');
        container.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = data.text;
        container.appendChild(card);
    } catch (err) {
        console.error('Error loading immigration text', err);
        document.getElementById('immigration-content').textContent = 'Failed to load content.';
    }
}
loadImmigration();