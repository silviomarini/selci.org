export function SiteFooter() {
  return (
    <footer>
      <div className="footer-logo">
        <img src="/assets/images/logo-mark-green.png" alt="" aria-hidden="true" />
        <span className="footer-logo-text">selci</span>
      </div>
      <p className="footer-copy">&copy; 2026 Selci. Tutti i diritti riservati.</p>
      <nav className="footer-links" aria-label="Social">
        <a href="#">Instagram</a>
        <a href="#">TikTok</a>
      </nav>
    </footer>
  );
}
