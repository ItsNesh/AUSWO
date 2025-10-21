const { router } = require("argon");

async function loadImmigration() {
    try {
        const response = await fetch('Immigration.json');
        const data = await response.json();
        renderArticle(data);
        /*
        const container = document.getElementById('immigration-content');
        container.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'card';
        card.textContent = data.text;
        container.appendChild(card); */
    } catch (err) {
        console.error('Error loading immigration text', err);
        document.getElementById('immigration-content').textContent = 'Failed to load content.';
    }
}
document.addEventListener("DOMContentLoaded", () => {
    fetch("immigration.json")
        .then((response) => response.json())
        .then((data) => renderArticle(data))
        .catch((error) => console.error("Error loading JSON:", error));
});

function renderArticle(article) {
    const container = document.getElementById("article-container");
    container.innerHTML = `
        <header class="article-header">
            <h1>${article.title}</h1>
            <div class="article-meta">
                <span>By ${article.author}</span> |
                <span>${article.date}</span> |
                <span>${article.readTime} min read</span>
            </div>
        </header>

        ${article.sections.map(
            (section) => 
                <section class="content-section">
                    <h2>${section.heading}</h2>
                    <p>${section.text}</p>
                </section>
            
        ).join("")}

        <blockquote class="article-quote">
            “${article.quote}”
        </blockquote>

        <section class="author-card">
            <div>
                <h3>${article.author}</h3>
                <p>${article.authorBio}</p>
            </div>
    </section>
  `;
}

loadImmigration();
