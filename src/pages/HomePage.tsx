import { Link } from 'react-router-dom';
import { Search, Briefcase, Users, TrendingUp } from 'lucide-react';
import '../styles/HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Trouvez votre emploi idéal</h1>
          <p>Découvrez des milliers d'offres d'emploi et lancez votre carrière</p>
          <div className="hero-search">
            <input
              type="text"
              placeholder="Rechercher un emploi, une compétence..."
              className="search-input"
            />
            <button className="search-btn">
              <Search size={20} />
              Rechercher
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <Briefcase size={32} className="feature-icon" />
          <h3>Offres variées</h3>
          <p>Explorez des milliers d'offres d'emploi dans différents secteurs</p>
        </div>
        <div className="feature-card">
          <Users size={32} className="feature-icon" />
          <h3>Candidatures faciles</h3>
          <p>Postulez en quelques clics et suivez vos candidatures</p>
        </div>
        <div className="feature-card">
          <TrendingUp size={32} className="feature-icon" />
          <h3>Développez votre carrière</h3>
          <p>Trouvez l'opportunité qui correspond à vos ambitions</p>
        </div>
      </section>

      <section className="cta">
        <h2>Prêt à commencer ?</h2>
        <div className="cta-buttons">
          <Link to="/jobs" className="btn btn-primary">
            Voir les offres
          </Link>
          <Link to="/register" className="btn btn-secondary">
            S'inscrire gratuitement
          </Link>
        </div>
      </section>
    </div>
  );
}
