function createNewsCards(articles) {
    return articles.map(article => `
        <div class="news-card">
            <a href="/news-article.html?id=${article.id}" class=news-card-link"></a>
                <div class="news-card-image">
                    placeholder
                </div>
                <div class="news-card-content">
                    <span class="news-card-tag">${article.tag}</span>
                    <h3>${article.title}</h3>
                    <p>${article.description}</p>
                    <div class="news-card-meta">
                        <div class="news-card-avatar"></div>
                        <span>${article.author}</span>
                        <span>•</span>
                        <span>${article.date}</span>
                        <span>•</span>
                        <span>${article.readTime}</span>
                    </div>
                </div>
            </div>
        `).join('');
}

async function initializePage() {
    const mainContainer = document.querySelector('.page-container');
    if (!mainContainer) return;
    mainContainer.innerHTML = '';
    const heroSection = document.createElement('div');
    heroSection.className = 'hero-section';
    heroSection.innerHTML = `
        <h1> Stay Updated with<br>Immigration News and<br>Insights</h1>
        <p>Uncover the latest updates and insights from immigration experts in Australia. Get news, policy analysis and immigration news and developments</p>
        <div class="hero-buttons">
            <button class="btn btn-primary">Learn More</button>
            <button class="btn btn-secondary">Subscribe</button>
        </div>
    `;
    const newsSection = document.createElement('section');
    newsSection.className = 'news-section';
    const newsHeader = `
        <h2>Latest Immigration Updated</h2>
        <p class="subtitle">Stay informed about immigration news and policies</p>
    `;
    const newsGrid = document.createElement('div');
    newsGrid.className = 'news-grid';
    try {
        const response = await fetch('/migration-news.json');
        if (!response.ok) throw new Error('Failed to load news articles');
        const newsArticles = await response.json();
        newsGrid.innerHTML = createNewsCards(newsArticles);
    } catch (error) {
        console.error('Error loading news:', error);
        newsGrid.innerHTML = '<p> Unable to load news articles at this time.</p>';
    }
    const viewAllContainer = document.createElement('div');
    viewAllContainer.className = 'view-all-container';
    viewAllContainer.innerHTML = '<button class="btn-view-all">View all</button>';
    newsSection.innerHTML = newsHeader;
    newsSection.appendChild(newsGrid);
    newsSection.appendChild(viewAllContainer);
    mainContainer.appendChild(heroSection);
    mainContainer.appendChild(newsSection);
}
document.addEventListener('DOMContentLoaded', initializePage);