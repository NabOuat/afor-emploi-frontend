import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import '../styles/Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const breadcrumbMap: { [key: string]: BreadcrumbItem[] } = {
  '/admin/dashboard': [
    { label: 'Admin', path: '/admin/dashboard' },
    { label: 'Tableau de bord', path: '/admin/dashboard' },
  ],
  '/admin/actors': [
    { label: 'Admin', path: '/admin/dashboard' },
    { label: 'Gestion des acteurs', path: '/admin/actors' },
  ],
  '/admin/projects': [
    { label: 'Admin', path: '/admin/dashboard' },
    { label: 'Gestion des projets', path: '/admin/projects' },
  ],
  '/employees': [
    { label: 'Employés', path: '/employees' },
  ],
};

export default function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = breadcrumbMap[location.pathname] || [];

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumbs">
      <button className="breadcrumb-home" onClick={() => navigate('/admin/dashboard')} title="Accueil">
        <Home size={18} />
      </button>
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="breadcrumb-item">
          <ChevronRight size={16} />
          <button
            onClick={() => navigate(item.path)}
            className={`breadcrumb-link ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
          >
            {item.label}
          </button>
        </div>
      ))}
    </nav>
  );
}
