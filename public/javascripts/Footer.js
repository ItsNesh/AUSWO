const footerHTML = `
<footer class="footer">
  <div class="footer-container">
    <div class="footer-newsletter">
      <div class="footer-logo">AUSWO</div>
      <p>Subscribe for migration alerts, new tools, and release notes tailored to your journey.</p>
      <form class="newsletter-form">
        <input type="email" placeholder="you@example.com" required>
        <button type="submit">Join</button>
        <small>By subscribing you agree to receive product updates and our privacy policy.</small>
      </form>
    </div>

    <div class="footer-section">
      <h3>Quick links</h3>
      <ul class="footer-links">
        <li><a href="/index.html">Home</a></li>
        <li><a href="/points-calculator.html">Points calculator</a></li>
        <li><a href="/contact.html">Contact</a></li>
        <li><a href="/Login.html">Sign in</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h3>Resources</h3>
      <ul class="footer-links">
        <li><a href="/visa-options.html">Visa Options</a></li>
        <li><a href="/student-resources.html">Student Resources</a></li>
        <li><a href="/popular-pathways.html">Popular Pathways</a></li>
        <li><a href="/occupation-list.html">Occupation List</a></li>
        <li><a href="/migration-news.html">Migration News</a></li>
        <li><a href="/quick-news.html">Quick News</a></li>
      </ul>
    </div>

    <div class="footer-section">
      <h3>Connect</h3>
      <div class="footer-social">
        <a href="https://www.linkedin.com/company/auswo/about/" target="_blank" rel="noopener" class="social-link">LinkedIn</a>
        <a href="https://www.facebook.com/p/AUSWO-Guiding-Your-Path-to-Australia-61576034790464/" target="_blank" rel="noopener" class="social-link">Facebook</a>
        <a href="https://www.instagram.com/auswo_australia/?fbclid=IwY2xjawNu2ApleHRuA2FlbQIxMABicmlkETE3cW1OeXZXN3JxSkxUZVFvAR7NJKE4bR4NmprVrNYPLVg0Ac1lDVDI65zz7W7d43m-Hm08v7Y_MHrHdGazsw_aem_lPvc3D6NsYkNDnM_QcYVQw#" target="_blank" rel="noopener" class="social-link">Instagram</a>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2025 AUSWO. All rights reserved.</p>
      <div class="footer-legal">
        <a href="/contact.html">Support</a>
        <a href="/contact.html">Request a callback</a>
      </div>
    </div>
  </div>
</footer>
`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('beforeend', footerHTML);
  const newsletter = document.querySelector('.newsletter-form');
  if (newsletter) {
    newsletter.addEventListener('submit', event => {
      event.preventDefault();
      event.currentTarget.reset();
      alert('Thanks for subscribing! We will keep you updated.');
    });
  }
});
