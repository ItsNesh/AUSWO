const footerHTML = `
<footer class="footer">
    <div class="footer-container">
        <div class="footer-newsletter">
            <div class="footer-logo">AUSWO</div>
            <p> Subscribe to our newsletter for the lastest updates on featers and releases.</p>
            <form class="newsletter-form">
                <input type="email" placeholder="Your Email here" required>
                <button type="submit">Join</button>
                <small> By Subscribing, you consent to our Privacy Policy and agree to recieve updates.</small>
            </form>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
            <h3>Quick Links</h3>
            <ul class="footer-links">
                <li><a href="/about.html">About Us</a></li>
                <li><a href="/contact.html">Contact Us</a></li>
                <li><a href="/services.html">Services</a></li>
                <li><a href="/blog.html">Blog</a></li>
                <li><a href="/faqs.html">FAQs</a></li>
            </ul>
        </div>

        <!-- Resources -->
        <div class="footer-section">
            <h3>Resources</h3>
            <ul class="footer-links">
                <li><a href="/guides.html">Guides</a></li>
                <li><a href="/webinars.html">Webinars</a></li>
                <li><a href="/case-studies.html">Case Studies</a></li>
                <li><a href="/testimonials.html">Testimonials</a></li>
                <li><a href="/migration-news.html">News</a></li>
            </ul>
        </div>

        <!-- Connect With Us -->
        <div class="footer-section">
            <h3>Connect With Us</h3>
            <div class="footer-social">
                <a href="#" class="social-link"><svg fill="currentColor"></svg> Facebook</a>
                <a href="#" class="social-link"><svg fill="currentColor"></svg> Instagram</a>
                <a href="#" class="social-link"><svg fill="currentColor"></svg> X</a>
                <a href="#" class="social-link"><svg fill="currentColor"></svg> LinkedIn</a>
                <a href="#" class="social-link"><svg fill="currentColor"></svg> YouTube</a>
            </div>
        </div>
<!-- Footer Bottom -->
        <div class="footer-bottom">
            <p>&copy; 2025 AUSWO. All rights reserved.</p>
            <div class="footer-legal">
                <a href="/privacy-policy.html">Privacy Policy</a>
                <a href="/terms-of-service.html">Terms of Service</a>
                <a href="/cookie-settings.html">Cookie Settings</a>
            </div>
        </div>
    </div>
</footer>
`;

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML('beforeend', footerHTML);
});