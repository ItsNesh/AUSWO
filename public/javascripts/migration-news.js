function createNewsCards(articles) {
  return articles
    .map(
      article => `
        <article class="news-card">
          <span class="news-card-tag">${article.tag ?? 'News'}</span>
          <h3>${article.title ?? 'Migration update'}</h3>
          <p>${article.description ?? ''}</p>
          <div class="news-card-meta">
            <span>${article.author ?? 'AUSWO editorial'}</span>
            <span>${article.date ?? ''}</span>
            <span>${article.readTime ?? ''}</span>
          </div>
        </article>
      `,
    )
    .join('');
}

async function fetchNewsArticles() {
  try {
    const response = await fetch('/migration-news.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Unable to load migration news.');
    return await response.json();
  } catch (error) {
    console.error('Error loading news:', error);
    return [];
  }
}

async function renderNewsPage() {
  const root = document.getElementById('news-root');
  if (!root) return;

  root.innerHTML = `
    <div class="hero news-hero">
      <span class="pill">Migration insights</span>
      <h1>Stay ahead of Australian migration news.</h1>
      <p>
        We track government announcements, occupation updates, and policy changes daily so you can focus on planning your move.
      </p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="/quick-news.html">Daily quick news</a>
        <a class="btn btn-secondary" href="/contact.html">Talk to our team</a>
      </div>
    </div>
    <div class="section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Latest articles</h2>
          <p class="section-subtitle">
            Curated long-form analysis from the AUSWO editorial team. Updated weekly with the developments that matter most.
          </p>
        </div>
      </div>
      <div class="news-grid" id="news-grid"></div>
      <div class="view-all-container">
        <button class="btn-view-all" type="button">View archive</button>
      </div>
    </div>
  `;

  const grid = document.getElementById('news-grid');
  const articles = await fetchNewsArticles();

  if (!Array.isArray(articles) || articles.length === 0) {
    grid.outerHTML = '<div class="news-empty">We are preparing new stories. Check back soon.</div>';
    return;
  }

  grid.innerHTML = createNewsCards(articles);
  const viewAll = document.querySelector('.btn-view-all');
  if (viewAll) {
    viewAll.addEventListener('click', () => window.location.href = '/migration-news.html#archive');
  }
}

document.addEventListener('DOMContentLoaded', renderNewsPage);
