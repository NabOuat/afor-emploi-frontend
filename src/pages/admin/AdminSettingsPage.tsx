import { useState } from 'react';
import {
  User, Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle,
  Moon, Sun, Shield, Palette, ChevronRight, KeyRound, UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';

interface Toast { type: 'success' | 'error'; message: string; }
type Tab = 'profil' | 'securite' | 'apparence';

function useTheme(dark: boolean) {
  return {
    page:        dark ? '#0d1117' : '#f0f2f5',
    card:        dark ? '#161b27' : '#ffffff',
    cardAlt:     dark ? '#1c2333' : '#f8fafc',
    nav:         dark ? '#12192a' : '#ffffff',
    input:       dark ? '#1e2840' : '#ffffff',
    inputBorder: dark ? '#2e3a52' : '#dde3ed',
    inputFocus:  dark ? '#3a4d6e' : '#9B59B6',
    border:      dark ? '#222d42' : '#e8edf3',
    text:        dark ? '#e2e8f0' : '#1a2332',
    textSub:     dark ? '#7a8ba5' : '#64748b',
    textMuted:   dark ? '#3d4e68' : '#b8c3d4',
    accent:      '#9B59B6',
    accentLight: dark ? 'rgba(155,89,182,0.18)' : 'rgba(155,89,182,0.10)',
    danger:      '#E74C3C',
    dangerLight: dark ? 'rgba(231,76,60,0.15)' : 'rgba(231,76,60,0.08)',
    success:     '#27AE60',
    blue:        '#3498DB',
    blueLight:   dark ? 'rgba(52,152,219,0.15)' : 'rgba(52,152,219,0.08)',
    shadow:      dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
  };
}

const PALETTE = ['#9B59B6', '#3498DB', '#27AE60', '#E74C3C', '#FF8C00', '#1ABC9C'];
function avatarBg(s: string) { let h = 0; for (const c of s) h += c.charCodeAt(0); return PALETTE[h % PALETTE.length]; }

function pwdStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: '#e8edf3' };
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: 'Très faible', color: '#E74C3C' };
  if (score === 2) return { score, label: 'Faible',     color: '#FF8C00' };
  if (score === 3) return { score, label: 'Moyen',      color: '#F39C12' };
  if (score === 4) return { score, label: 'Fort',       color: '#27AE60' };
  return { score, label: 'Très fort', color: '#1ABC9C' };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const t = useTheme(darkMode);
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const [toast, setToast] = useState<Toast | null>(null);

  const [profile, setProfile] = useState({ nom: user?.nom || '', prenom: user?.prenom || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd]         = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const strength = pwdStrength(pwd.new);

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
      showToast('success', 'Profil mis à jour avec succès.');
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    setPwdError('');
    if (!pwd.old || !pwd.new || !pwd.confirm) { setPwdError('Tous les champs sont requis.'); return; }
    if (pwd.new.length < 8) { setPwdError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (pwd.new !== pwd.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }
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

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 9,
    border: `1.5px solid ${t.inputBorder}`, fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box',
    background: t.input, color: t.text,
    transition: 'border-color 0.15s',
  };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: t.textSub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };

  const username = user?.username || 'AD';
  const displayName = (user?.prenom && user?.nom) ? `${user.prenom} ${user.nom}` : username;
  const bg = avatarBg(username);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profil',    label: 'Profil',     icon: <UserCog size={17} /> },
    { key: 'securite',  label: 'Sécurité',   icon: <KeyRound size={17} /> },
    { key: 'apparence', label: 'Apparence',  icon: <Palette size={17} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: t.page, padding: '28px 24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderRadius: 12, color: '#fff', fontSize: '0.88rem', fontWeight: 600, background: toast.type === 'success' ? t.success : t.danger, boxShadow: '0 6px 24px rgba(0,0,0,0.25)', animation: 'slideIn 0.2s ease' }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, color: t.text }}>Paramètres</h1>
        <p style={{ margin: '4px 0 0', color: t.textSub, fontSize: '0.88rem' }}>Gérez votre compte et vos préférences</p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Left nav panel ── */}
        <div style={{ width: 240, flexShrink: 0, background: t.nav, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>

          {/* Avatar block */}
          <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.6rem', fontWeight: 900, color: '#fff', boxShadow: `0 6px 20px ${bg}55` }}>
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontWeight: 800, color: t.text, fontSize: '0.95rem', marginBottom: 4 }}>{displayName}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <div style={{ padding: '3px 10px', borderRadius: 20, background: t.accentLight, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield size={11} color={t.accent} />
                <span style={{ fontSize: '0.75rem', color: t.accent, fontWeight: 700 }}>Administrateur</span>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: t.textSub }}>@{username}</div>
          </div>

          {/* Tab nav */}
          <nav style={{ padding: '12px 10px' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: active ? t.accentLight : 'transparent', color: active ? t.accent : t.textSub, fontWeight: active ? 700 : 500, fontSize: '0.88rem', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {tab.icon}
                    {tab.label}
                  </div>
                  {active && <ChevronRight size={15} />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right content ── */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 600 }}>

          {/* ══ PROFIL ══ */}
          {activeTab === 'profil' && (
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '22px 28px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: t.accentLight, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={19} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: t.text }}>Informations personnelles</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: t.textSub }}>Mettez à jour vos informations de profil</p>
                </div>
              </div>

              <div style={{ padding: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  {[{ label: 'Prénom', key: 'prenom', ph: 'Jean' }, { label: 'Nom', key: 'nom', ph: 'Dupont' }].map(({ label, key, ph }) => (
                    <div key={key}>
                      <label style={lbl}>{label}</label>
                      <input value={(profile as any)[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={inp} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Identifiant</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: `1.5px solid ${t.inputBorder}`, background: t.cardAlt }}>
                    <User size={16} color={t.textMuted} />
                    <span style={{ color: t.textSub, fontSize: '0.9rem' }}>@{username}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: t.textMuted, background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 6 }}>Non modifiable</span>
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={lbl}>Adresse email</label>
                  <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="admin@exemple.ci" style={inp} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSaveProfile} disabled={savingProfile} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 24px', borderRadius: 10, border: 'none', background: savingProfile ? '#aaa' : `linear-gradient(135deg, ${t.accent}, #8e44ad)`, color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: savingProfile ? 'not-allowed' : 'pointer', boxShadow: savingProfile ? 'none' : `0 4px 14px ${t.accent}55` }}>
                    {savingProfile ? <div style={{ width: 15, height: 15, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Save size={16} />}
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ SÉCURITÉ ══ */}
          {activeTab === 'securite' && (
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '22px 28px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: t.dangerLight, color: t.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={19} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: t.text }}>Changer le mot de passe</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: t.textSub }}>Utilisez un mot de passe fort et unique</p>
                </div>
              </div>

              <div style={{ padding: '28px' }}>
                {pwdError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: t.dangerLight, border: `1px solid rgba(231,76,60,0.25)`, color: t.danger, fontSize: '0.88rem', marginBottom: 20 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} /> {pwdError}
                  </div>
                )}

                {/* Current password */}
                <div style={{ marginBottom: 18 }}>
                  <label style={lbl}>Mot de passe actuel</label>
                  <PwdField value={pwd.old} show={showPwd.old} onChange={v => setPwd(p => ({ ...p, old: v }))} onToggle={() => setShowPwd(s => ({ ...s, old: !s.old }))} inp={inp} t={t} placeholder="Votre mot de passe actuel" />
                </div>

                <div style={{ height: 1, background: t.border, margin: '4px 0 20px' }} />

                {/* New password + strength */}
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl}>Nouveau mot de passe</label>
                  <PwdField value={pwd.new} show={showPwd.new} onChange={v => setPwd(p => ({ ...p, new: v }))} onToggle={() => setShowPwd(s => ({ ...s, new: !s.new }))} inp={inp} t={t} placeholder="Min. 8 caractères" />
                </div>

                {/* Strength bar */}
                {pwd.new && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= strength.score ? strength.color : t.border, transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                  </div>
                )}

                <div style={{ marginBottom: 28 }}>
                  <label style={lbl}>Confirmer le nouveau mot de passe</label>
                  <PwdField value={pwd.confirm} show={showPwd.confirm} onChange={v => setPwd(p => ({ ...p, confirm: v }))} onToggle={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))} inp={{ ...inp, borderColor: pwd.confirm && pwd.confirm !== pwd.new ? t.danger : t.inputBorder }} t={t} placeholder="Répéter le mot de passe" />
                  {pwd.confirm && pwd.confirm !== pwd.new && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: t.danger }}>Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleChangePassword} disabled={savingPwd} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 24px', borderRadius: 10, border: 'none', background: savingPwd ? '#aaa' : t.danger, color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: savingPwd ? 'not-allowed' : 'pointer', boxShadow: savingPwd ? 'none' : `0 4px 14px ${t.danger}44` }}>
                    {savingPwd ? <div style={{ width: 15, height: 15, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Lock size={16} />}
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ APPARENCE ══ */}
          {activeTab === 'apparence' && (
            <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '22px 28px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: t.blueLight, color: t.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Palette size={19} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: t.text }}>Apparence</h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: t.textSub }}>Personnalisez l'interface</p>
                </div>
              </div>

              <div style={{ padding: '28px' }}>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', fontWeight: 700, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thème</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                  {/* Light mode option */}
                  <button onClick={() => darkMode && toggleDarkMode()} style={{ padding: '18px', borderRadius: 12, border: `2px solid ${!darkMode ? t.accent : t.border}`, background: !darkMode ? t.accentLight : t.cardAlt, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', border: '1px solid #e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                      <Sun size={18} color="#FF8C00" />
                    </div>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: '0.88rem' }}>Mode clair</div>
                    <div style={{ fontSize: '0.76rem', color: t.textSub, marginTop: 2 }}>Interface lumineuse</div>
                    {!darkMode && <div style={{ marginTop: 8, fontSize: '0.72rem', color: t.accent, fontWeight: 700 }}>✓ Actif</div>}
                  </button>

                  {/* Dark mode option */}
                  <button onClick={() => !darkMode && toggleDarkMode()} style={{ padding: '18px', borderRadius: 12, border: `2px solid ${darkMode ? t.accent : t.border}`, background: darkMode ? t.accentLight : t.cardAlt, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#1a2234', border: '1px solid #2e3a52', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Moon size={18} color="#9B59B6" />
                    </div>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: '0.88rem' }}>Mode sombre</div>
                    <div style={{ fontSize: '0.76rem', color: t.textSub, marginTop: 2 }}>Interface sombre</div>
                    {darkMode && <div style={{ marginTop: 8, fontSize: '0.72rem', color: t.accent, fontWeight: 700 }}>✓ Actif</div>}
                  </button>
                </div>

                {/* Quick toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: t.cardAlt, border: `1px solid ${t.border}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {darkMode ? <Moon size={20} color={t.textSub} /> : <Sun size={20} color="#FF8C00" />}
                    <div>
                      <div style={{ fontWeight: 600, color: t.text, fontSize: '0.9rem' }}>Basculer le thème</div>
                      <div style={{ fontSize: '0.78rem', color: t.textSub }}>Actuellement : {darkMode ? 'mode sombre' : 'mode clair'}</div>
                    </div>
                  </div>
                  <button onClick={toggleDarkMode} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: darkMode ? t.accent : '#dde3ed', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 4, left: darkMode ? 26 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        input::placeholder { color: ${darkMode ? '#3d4e68' : '#b8c3d4'} }
      `}</style>
    </div>
  );
}

function PwdField({ value, show, onChange, onToggle, inp, t, placeholder }: {
  value: string; show: boolean; onChange: (v: string) => void;
  onToggle: () => void; inp: React.CSSProperties; t: ReturnType<typeof useTheme>; placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || '••••••••'}
        style={{ ...inp, paddingRight: 44 }} />
      <button type="button" onClick={onToggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textSub, padding: 4, display: 'flex', alignItems: 'center' }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
