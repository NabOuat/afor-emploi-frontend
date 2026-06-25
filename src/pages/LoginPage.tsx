import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Moon, Sun, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { getDashboardPath } from '../utils/navigation';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [darkMode, toggleDarkMode]    = useDarkMode();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate                      = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const actorType = sessionStorage.getItem('actor_type') || null;
      const dashboardPath = getDashboardPath(actorType);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await login({ username, password });
    } catch (err) {
      console.error('Login error:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">

      {/* Dark-mode toggle */}
      <button
        className="dark-mode-toggle"
        onClick={toggleDarkMode}
        title={darkMode ? 'Basculer vers le mode clair' : 'Basculer vers le mode sombre'}
        aria-label={darkMode ? 'Mode clair' : 'Mode sombre'}
      >
        {darkMode ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* ── Left brand panel ── */}
      <div className="login-brand-panel">
        <div className="login-left-deco deco1" aria-hidden="true" />
        <div className="login-left-deco deco2" aria-hidden="true" />

        <div className="login-brand">
          <div className="login-logo-ring">
            <div className="login-logo-inner">AE</div>
          </div>
          <h1>AFOR Emploi</h1>
          <p className="login-sub">Plateforme de gestion du personnel et des contrats</p>

          <div className="login-features">
            <div className="lf-item"><span className="lf-dot" aria-hidden="true" />Gestion des employés & contrats</div>
            <div className="lf-item"><span className="lf-dot" aria-hidden="true" />Suivi des projets et zones</div>
            <div className="lf-item"><span className="lf-dot" aria-hidden="true" />Tableau de bord centralisé</div>
            <div className="lf-item"><span className="lf-dot" aria-hidden="true" />Rapports et statistiques</div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-form-card">

          <div className="lfc-header">
            <div className="lfc-avatar">AE</div>
            <h2>Connexion</h2>
            <p>Accédez à votre espace de travail</p>
          </div>

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="username">Nom d'utilisateur</label>
              <div className="input-wrap">
                <Mail size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="votre_nom_utilisateur"
                  autoComplete="username"
                  required
                  aria-required="true"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrap">
                <Lock size={18} className="input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isSubmitting || !username || !password} 
              className="submit-btn"
              aria-busy={isSubmitting || isLoading}
            >
              {(isLoading || isSubmitting) ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          <p className="login-footer">
            © {new Date().getFullYear()} AFOR — Tous droits réservés DSG
          </p>
        </div>
      </div>

    </div>
  );
}
