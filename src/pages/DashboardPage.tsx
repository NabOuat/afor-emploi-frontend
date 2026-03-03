import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Bienvenue sur votre Dashboard</h1>
            <p>Gérez vos offres d'emploi et candidatures</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <h2>Offres d'emploi</h2>
            <p>Consultez les offres disponibles</p>
            <button className="card-btn">Voir les offres</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📝</div>
            <h2>Mes candidatures</h2>
            <p>Suivez vos candidatures</p>
            <button className="card-btn">Mes candidatures</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h2>Mon profil</h2>
            <p>Mettez à jour votre profil</p>
            <button className="card-btn">Éditer le profil</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h2>Paramètres</h2>
            <p>Gérez vos préférences</p>
            <button className="card-btn">Paramètres</button>
          </div>
        </div>
      </div>
    </div>
  );
}
