import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Settings,
  LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  Building2, X, Globe, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
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
        { label: 'Utilisateurs',    path: '/admin/users',     icon: Settings },
        { label: 'Zones',           path: '/admin/zones',     icon: Globe },
        { label: 'Géographie',      path: '/admin/geo',       icon: MapPin },
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
        { label: 'Paramètres',      path: '/responsable/settings',  icon: Settings },
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

const CHIBI_AVATARS = [
  { id: 'chibi1', emoji: '🧑‍💼', bg: '#FF8C00' },
  { id: 'chibi2', emoji: '👩‍💼', bg: '#3498DB' },
  { id: 'chibi3', emoji: '🦁', bg: '#F39C12' },
  { id: 'chibi4', emoji: '🐯', bg: '#E74C3C' },
  { id: 'chibi5', emoji: '🦊', bg: '#27AE60' },
  { id: 'chibi6', emoji: '🐻', bg: '#9B59B6' },
  { id: 'chibi7', emoji: '🐼', bg: '#1ABC9C' },
  { id: 'chibi8', emoji: '🦉', bg: '#34495E' },
];

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, actorType, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) setSelectedAvatar(savedAvatar);
  }, []);

  const handleSelectAvatar = (avatarId: string | null) => {
    setSelectedAvatar(avatarId);
    if (avatarId) {
      localStorage.setItem('user_avatar', avatarId);
    } else {
      localStorage.removeItem('user_avatar');
    }
    setShowAvatarPicker(false);
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
        <div className="sidebar-user-info" style={{ position: 'relative' }}>
          <div
            className="sidebar-user-avatar"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            style={{ cursor: 'pointer', fontSize: selectedAvatar ? '1.2rem' : '0.82rem', fontWeight: 700 }}
            title="Changer d'avatar"
          >
            {selectedAvatar
              ? CHIBI_AVATARS.find(a => a.id === selectedAvatar)?.emoji || getInitials(user.username)
              : getInitials(user.username)
            }
          </div>
          <div className="sidebar-user-text">
            <span className="sidebar-user-name">{user.nom && user.prenom ? `${user.prenom} ${user.nom}` : user.username}</span>
            <span className="sidebar-user-role">{roleLabel}</span>
          </div>

          {showAvatarPicker && (
            <div className="avatar-picker">
              <p className="avatar-picker-title">Choisir un avatar</p>
              <div className="avatar-picker-grid">
                <button
                  className={`avatar-option ${!selectedAvatar ? 'active' : ''}`}
                  onClick={() => handleSelectAvatar(null)}
                  title="Initiales"
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{getInitials(user.username)}</span>
                </button>
                {CHIBI_AVATARS.map(a => (
                  <button
                    key={a.id}
                    className={`avatar-option ${selectedAvatar === a.id ? 'active' : ''}`}
                    onClick={() => handleSelectAvatar(a.id)}
                    style={{ background: a.bg + '22' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{a.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {collapsed && user && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div
            className="sidebar-user-avatar"
            title={user.username}
            style={{ fontSize: selectedAvatar ? '1.2rem' : '0.82rem', fontWeight: 700 }}
          >
            {selectedAvatar
              ? CHIBI_AVATARS.find(a => a.id === selectedAvatar)?.emoji || getInitials(user.username)
              : getInitials(user.username)
            }
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
