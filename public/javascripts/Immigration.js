async function fetchImmigrationBriefing() {
  try {
    const response = await fetch('/Immigration.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Unable to load immigration briefing.');
    return await response.json();
  } catch (error) {
    console.error('Error loading immigration briefing', error);
    return null;
  }
}

function renderImmigrationArticle(article) {
  const container = document.getElementById('article-container');
  if (!container) return;

  if (!article) {
    container.innerHTML = '<div class="table-empty">We could not load the latest briefing. Please try again later.</div>';
    return;
  }

  const sections = Array.isArray(article.sections)
    ? article.sections
        .map(
          section => `
            <section class="article-section">
              <h2>${section.heading ?? ''}</h2>
              <p>${section.text ?? ''}</p>
            </section>
          `,
        )
        .join('')
    : '';

  container.innerHTML = `
    <header class="article-header">
      <h1>${article.title ?? 'Immigration update'}</h1>
      <div class="article-meta">
        <span>${article.author ?? 'AUSWO Editorial'}</span>
        <span>${article.date ?? ''}</span>
        <span>${article.readTime ?? ''}</span>
      </div>
    </header>
    ${sections}
    ${
      article.quote
        ? `<blockquote class="article-quote">“${article.quote}”</blockquote>`
        : ''
    }
    <footer class="article-footer surface-soft">
      <strong>Need personalised advice?</strong>
      <p class="muted">Keep your profile up to date and connect with our advisors for tailored guidance.</p>
      <a class="btn btn-outline" href="/contact.html">Contact AUSWO advisors</a>
    </footer>
  `;
}

async function initImmigrationPage() {
  const article = await fetchImmigrationBriefing();
  renderImmigrationArticle(article);
}

document.addEventListener('DOMContentLoaded', initImmigrationPage);
