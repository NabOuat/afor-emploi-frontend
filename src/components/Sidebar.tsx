import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Settings,
  LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  Building2, UserCheck, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function getNavItems(actorType: string | null): NavItem[] {
  const type = (actorType || '').toUpperCase();
  switch (type) {
    case 'AD':
      return [
        { label: 'Tableau de bord', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Acteurs',         path: '/admin/actors',    icon: Building2 },
        { label: 'Projets',         path: '/admin/projects',  icon: Briefcase },
        { label: 'Employés',        path: '/employees',       icon: Users },
      ];
    case 'AF':
      return [
        { label: 'Tableau de bord', path: '/afor/dashboard', icon: LayoutDashboard },
        { label: 'Employés',        path: '/employees',      icon: Users },
        { label: 'Paramètres',      path: '/afor/settings',  icon: Settings },
      ];
    case 'OF':
      return [
        { label: 'Tableau de bord', path: '/operator/dashboard', icon: LayoutDashboard },
        { label: 'Employés',        path: '/employees',          icon: Users },
        { label: 'Paramètres',      path: '/operator/settings',  icon: Settings },
      ];
    case 'RESPO':
      return [
        { label: 'Tableau de bord', path: '/responsable/dashboard', icon: LayoutDashboard },
        { label: 'Employés',        path: '/employees',             icon: Users },
      ];
    default:
      return [
        { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard },
      ];
  }
}

function getRoleLabel(actorType: string | null): string {
  switch ((actorType || '').toUpperCase()) {
    case 'AD':    return 'Administrateur';
    case 'AF':    return 'AFOR';
    case 'OF':    return 'Opérateur';
    case 'RESPO': return 'Responsable';
    default:      return 'Utilisateur';
  }
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, actorType, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    document.documentElement.classList.toggle('dark-mode', saved);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark-mode', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNav = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const navItems  = getNavItems(actorType);
  const roleLabel = getRoleLabel(actorType);

  const sidebarClass = [
    'app-sidebar',
    collapsed   ? 'collapsed'    : '',
    darkMode    ? 'dark'         : '',
    mobileOpen  ? 'mobile-open'  : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass}>

      {/* Logo + collapse toggle */}
      <div className="sidebar-logo-bar">
        {!collapsed && (
          <div className="sidebar-logo-content">
            <img src="/afor-logo.jpeg" alt="AFOR" className="sidebar-logo-img" />
            <span className="sidebar-logo-name">AFOR</span>
          </div>
        )}
        {/* Desktop collapse btn */}
        <button
          className="sidebar-collapse-btn desktop-only"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Développer' : 'Réduire'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Mobile close btn */}
        <button
          className="sidebar-collapse-btn mobile-only"
          onClick={onMobileClose}
          title="Fermer"
        >
          <X size={18} />
        </button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">
            <UserCheck size={18} />
          </div>
          <div className="sidebar-user-text">
            <span className="sidebar-user-name">{user.username}</span>
            <span className="sidebar-user-role">{roleLabel}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="sidebar-body">
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                onClick={() => handleNav(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: dark mode + logout */}
      <div className="sidebar-footer">
        <button
          className="sidebar-nav-item"
          onClick={toggleDarkMode}
          title={darkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{darkMode ? 'Mode clair' : 'Mode sombre'}</span>}
        </button>
        <button
          className="sidebar-nav-item logout-item"
          onClick={handleLogout}
          title="Déconnexion"
        >
          <LogOut size={20} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
