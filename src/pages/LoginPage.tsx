import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // Vérifier le type d'acteur et rediriger vers le bon dashboard
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const actorType = user.actor_type;
          
          if (actorType === 'RESPO') {
            navigate('/responsable/dashboard');
          } else {
            navigate('/dashboard');
          }
        } catch (err) {
          console.error('Erreur lors de la lecture du type d\'acteur:', err);
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }

    try {
      await login({ username, password });
      setTimeout(() => {
        // Vérifier le type d'acteur et rediriger vers le bon dashboard
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const actorType = user.actor_type;
            
            if (actorType === 'RESPO') {
              navigate('/responsable/dashboard');
            } else {
              navigate('/dashboard');
            }
          } catch (err) {
            console.error('Erreur lors de la lecture du type d\'acteur:', err);
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background"></div>
      
      <button className="dark-mode-toggle" onClick={toggleDarkMode} title="Basculer le mode sombre">
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className="login-container">
        <div className="login-card">
          <div className="logo-container">
            <img src="/afor-logo.jpeg" alt="Afor Logo" className="logo-image" />
          </div>

          <div className="login-header">
            <h1>Connexion</h1>
            <p className="tagline">Accédez à votre espace emploi</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
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
                <Lock size={20} className="input-icon" />
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
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
