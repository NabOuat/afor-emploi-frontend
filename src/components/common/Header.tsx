import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>Afor Emploi</h1>
        </div>
        
        <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/">Accueil</Link>
          <Link to="/jobs">Offres d'emploi</Link>
          <Link to="/applications">Mes candidatures</Link>
          <Link to="/profile">Profil</Link>
        </nav>

        <div className="header-actions">
          <Link to="/login" className="login-btn">Connexion</Link>
          <button className="signup-btn">S'inscrire</button>
          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
