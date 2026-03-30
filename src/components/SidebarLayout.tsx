import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import './Sidebar.css';

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode,   setDarkMode]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark-mode'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sidebar-layout">
      {/* Mobile top bar (hidden on desktop via CSS) */}
      <div className={`mobile-topbar${darkMode ? ' dark' : ''}`}>
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} title="Menu">
          <Menu size={22} />
        </button>
        <div className="mobile-topbar-logo">
          <img src="/afor-logo.jpeg" alt="AFOR" />
          <span>AFOR</span>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="sidebar-layout-content">
        {children}
      </main>
    </div>
  );
}
