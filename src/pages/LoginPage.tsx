import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import '../styles/LoginPage.css';

function getDashboardPath(actorType: string | null): string {
  switch ((actorType || '').toUpperCase()) {
    case 'AF':    return '/afor/dashboard';
    case 'OF':    return '/operator/dashboard';
    case 'AD':    return '/admin/dashboard';
    case 'RESPO': return '/responsable/dashboard';
    default:      return '/dashboard';
  }
}

export default function LoginPage() {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [darkMode, toggleDarkMode]    = useDarkMode();
  const [showPassword, setShowPassword] = useState(false);
  const navigate                      = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const actorType = sessionStorage.getItem('actor_type') || null;
      navigate(getDashboardPath(actorType));
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      await login({ username, password });
      const actorType = sessionStorage.getItem('actor_type') || null;
      navigate(getDashboardPath(actorType));
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-page">

      {/* Dark-mode toggle */}
      <button
        className="dark-mode-toggle"
        onClick={toggleDarkMode}
        title="Basculer le mode sombre"
      >
        {darkMode ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* ── Left brand panel ── */}
      <div className="login-brand-panel">
        <div className="brand-circle brand-circle-1" />
        <div className="brand-circle brand-circle-2" />
        <div className="brand-circle brand-circle-3" />

        <div className="brand-content">
          <img src="/afor-logo.jpeg" alt="Afor Logo" className="brand-logo" />

          <h2 className="brand-title">
            Bienvenue sur<br />AFOR Emploi
          </h2>

          <p className="brand-subtitle">
            La plateforme de gestion de l'emploi et de la formation professionnelle en Côte d'Ivoire.
          </p>

          <div className="brand-features">
            {[
              'Gestion des offres d\'emploi',
              'Suivi des formations professionnelles',
              'Tableau de bord centralisé',
              'Rapports et statistiques en temps réel',
            ].map((item) => (
              <div key={item} className="brand-feature-item">
                <span className="brand-feature-dot" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">

          <div className="login-header">
            <h1>Connexion</h1>
            <p className="tagline">Accédez à votre espace emploi</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="votre_nom_utilisateur"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="login-footer">
            © {new Date().getFullYear()} AFOR — Agence d'Études et de Promotion de l'Emploi
          </p>
        </div>
      </div>

    </div>
  );
}
