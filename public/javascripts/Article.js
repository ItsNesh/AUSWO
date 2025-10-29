async function fetchArticleById(articleId) {
  try {
    const response = await fetch('/migration-news.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Unable to load article.');
    const articles = await response.json();
    return articles.find(article => article.id === articleId);
  } catch (error) {
    console.error('Error loading article:', error);
    return null;
  }
}

function renderArticle(article) {
  if (!article) {
    return `
      <div class="article-error">
        <h1>Article not found</h1>
        <p>The article you're looking for doesn't exist or has been removed.</p>
        <a href="/migration-news.html" class="btn btn-article-primary">Return to News</a>
      </div>
    `;
  }

  return `
    <div class="article-page-header">
      <span class="article-tag">${article.tag ?? 'News'}</span>
      <h1 class="article-title">${article.title ?? 'Untitled Article'}</h1>
      <div class="article-info">
        <span class="article-author"><strong>Author:</strong> ${article.author ?? 'AUSWO Editorial'}</span>
        <span class="article-divider">|</span>
        <span class="article-date"><strong>Published:</strong> ${article.date ?? ''}</span>
        <span class="article-divider">|</span>
        <span class="article-read-time"><strong>${article.readTime ?? ''}</strong></span>
      </div>
    </div>
    <div class="article-body">
      ${article.content ?? '<p>No content available.</p>'}
    </div>
    <div class="article-page-footer">
      <a href="/migration-news.html" class="btn btn-article-secondary">← Back to News</a>
      <a href="/contact.html" class="btn btn-article-primary">Discuss with our team</a>
    </div>
  `;
}

async function loadArticlePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  
  const container = document.getElementById('article-content');
  if (!container) return;

  if (!articleId) {
    container.innerHTML = `
      <div class="article-error">
        <h1>No article specified</h1>
        <p>Please select an article from the news page.</p>
        <a href="/migration-news.html" class="btn btn-article-primary">View all articles</a>
      </div>
    `;
    return;
  }

  const article = await fetchArticleById(articleId);
  container.innerHTML = renderArticle(article);
  
  if (article && article.title) {
    document.title = `${article.title} · AUSWO`;
  }
}

document.addEventListener('DOMContentLoaded', loadArticlePage);