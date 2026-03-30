import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle, Moon, Sun, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';

interface Toast { type: 'success' | 'error'; message: string; }

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  const [toast, setToast] = useState<Toast | null>(null);

  // Profile
  const [profile, setProfile] = useState({
    nom:    user?.nom    || '',
    prenom: user?.prenom || '',
    email:  '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [pwd, setPwd]       = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async () => {
    if (!user?.username) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
        body: JSON.stringify({ username: user.username, ...profile }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast('error', e.detail || 'Erreur.'); return; }
      showToast('success', 'Profil mis à jour.');
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (!pwd.old || !pwd.new || !pwd.confirm) { setPwdError('Tous les champs sont requis.'); return; }
    if (pwd.new !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    if (pwd.new.length < 8) { setPwdError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (!user?.username) return;
    setSavingPwd(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
        body: JSON.stringify({ username: user.username, old_password: pwd.old, new_password: pwd.new }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setPwdError(e.detail || 'Erreur.'); return; }
      showToast('success', 'Mot de passe modifié avec succès.');
      setPwd({ old: '', new: '', confirm: '' });
    } catch { setPwdError('Erreur réseau.'); }
    finally { setSavingPwd(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #e8edf3', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5,
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 12, border: '1px solid #e8edf3',
    padding: '24px', marginBottom: 20,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', padding: '24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
          background: toast.type === 'success' ? '#27AE60' : '#E74C3C',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d' }}>Paramètres</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7a90', fontSize: '0.9rem' }}>
          Gérez votre profil et vos préférences
        </p>
      </div>

      <div style={{ maxWidth: 680 }}>

        {/* Profile card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(155,89,182,0.12)', color: '#9B59B6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f2d3d' }}>Profil</h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7a90' }}>Informations de votre compte</p>
            </div>
          </div>

          {/* Identity badge */}
          <div style={{ background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 10, background: 'linear-gradient(135deg, #9B59B6, #8e44ad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 800, flexShrink: 0,
            }}>
              {(user?.username || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1f2d3d', fontSize: '0.95rem' }}>{user?.username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Shield size={12} color="#9B59B6" />
                <span style={{ fontSize: '0.8rem', color: '#9B59B6', fontWeight: 600 }}>Administrateur</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { label: 'Nom', key: 'nom', ph: 'Dupont' },
              { label: 'Prénom', key: 'prenom', ph: 'Jean' },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  value={(profile as any)[key]}
                  onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={ph}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              placeholder="admin@exemple.ci"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSaveProfile} disabled={savingProfile} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 9, border: 'none',
              background: savingProfile ? '#ccc' : 'linear-gradient(135deg, #9B59B6, #8e44ad)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: savingProfile ? 'not-allowed' : 'pointer',
              boxShadow: '0 3px 10px rgba(155,89,182,0.3)',
            }}>
              {savingProfile
                ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Save size={15} />
              }
              Enregistrer
            </button>
          </div>
        </div>

        {/* Password card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(231,76,60,0.1)', color: '#E74C3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f2d3d' }}>Mot de passe</h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7a90' }}>Modifiez votre mot de passe de connexion</p>
            </div>
          </div>

          {pwdError && (
            <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#E74C3C', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {pwdError}
            </div>
          )}

          {[
            { label: 'Mot de passe actuel', key: 'old' as const },
            { label: 'Nouveau mot de passe', key: 'new' as const },
            { label: 'Confirmer le nouveau mot de passe', key: 'confirm' as const },
          ].map(({ label, key }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd[key] ? 'text' : 'password'}
                  value={pwd[key]}
                  onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPwd(s => ({ ...s, [key]: !s[key] }))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90', padding: 2 }}>
                  {showPwd[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={handleChangePassword} disabled={savingPwd} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 9, border: 'none',
              background: savingPwd ? '#ccc' : '#E74C3C',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: savingPwd ? 'not-allowed' : 'pointer',
            }}>
              {savingPwd
                ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Lock size={15} />
              }
              Changer le mot de passe
            </button>
          </div>
        </div>

        {/* Appearance card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(52,152,219,0.1)', color: '#3498DB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f2d3d' }}>Apparence</h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7a90' }}>Thème de l'interface</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {darkMode ? <Moon size={20} color="#6b7a90" /> : <Sun size={20} color="#FF8C00" />}
              <div>
                <div style={{ fontWeight: 600, color: '#1f2d3d', fontSize: '0.9rem' }}>{darkMode ? 'Mode sombre' : 'Mode clair'}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7a90' }}>Modifier l'apparence de l'interface</div>
              </div>
            </div>
            <button onClick={toggleDarkMode} style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: darkMode ? '#9B59B6' : '#e8edf3',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: darkMode ? 24 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
