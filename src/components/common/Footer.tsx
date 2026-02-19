import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>À propos</h3>
          <p>Afor Emploi est une plateforme de recherche d'emploi moderne et intuitive.</p>
        </div>

        <div className="footer-section">
          <h3>Liens rapides</h3>
          <ul>
            <li><a href="/">Accueil</a></li>
            <li><a href="/jobs">Offres d'emploi</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Légal</h3>
          <ul>
            <li><a href="/privacy">Politique de confidentialité</a></li>
            <li><a href="/terms">Conditions d'utilisation</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Nous suivre</h3>
          <div className="social-links">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="LinkedIn">in</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Afor Emploi. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
