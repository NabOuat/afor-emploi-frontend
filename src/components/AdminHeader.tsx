import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Settings, Home } from 'lucide-react';
import '../styles/AdminHeader.css';

export default function AdminHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header className="admin-header-top">
      <div className="admin-header-container">
        <div className="admin-header-left">
          <div className="admin-logo">
            <span className="logo-text">AFOR</span>
          </div>
          <nav className="admin-nav-menu">
            <button 
              className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              onClick={() => navigate('/admin/dashboard')}
            >
              <Home size={18} />
              Tableau de bord
            </button>
            <button 
              className={`nav-link ${isActive('/admin/actors') ? 'active' : ''}`}
              onClick={() => navigate('/admin/actors')}
            >
              Acteurs
            </button>
            <button 
              className={`nav-link ${isActive('/admin/projects') ? 'active' : ''}`}
              onClick={() => navigate('/admin/projects')}
            >
              Projets
            </button>
          </nav>
        </div>

        <div className="admin-header-right">
          <button className="header-btn settings" title="Paramètres">
            <Settings size={20} />
          </button>
          <button className="header-btn logout" onClick={handleLogout} title="Déconnexion">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
