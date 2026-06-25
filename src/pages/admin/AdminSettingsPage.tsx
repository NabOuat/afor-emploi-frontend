import { useState } from 'react';
import {
  User, Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle,
  Moon, Sun, Shield, Palette, ChevronRight, KeyRound, UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';
import '../../styles/AdminSettingsPage.css';

interface Toast { type: 'success' | 'error'; message: string; }
type Tab = 'profil' | 'securite' | 'apparence';

const PALETTE = ['#9B59B6', '#3498DB', '#27AE60', '#E74C3C', '#FF8C00', '#1ABC9C'];
function avatarBg(s: string) { let h = 0; for (const c of s) h += c.charCodeAt(0); return PALETTE[h % PALETTE.length]; }

function pwdStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: 'var(--border)' };
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
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

  const username    = user?.username || 'AD';
  const displayName = (user?.prenom && user?.nom) ? `${user.prenom} ${user.nom}` : username;
  const bg          = avatarBg(username);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profil',    label: 'Profil',    icon: <UserCog size={16}/> },
    { key: 'securite',  label: 'Sécurité',  icon: <KeyRound size={16}/> },
    { key: 'apparence', label: 'Apparence', icon: <Palette size={16}/> },
  ];

  return (
    <div className={`as-page${darkMode ? ' dark' : ''}`}>

      {toast && (
        <div className={`as-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
          {toast.message}
        </div>
      )}

      <div className="as-page-header">
        <h1>Paramètres</h1>
        <p>Gérez votre compte et vos préférences</p>
      </div>

      <div className="as-layout">

        {/* ── Sidebar nav ── */}
        <aside className="as-nav">
          <div className="as-nav-avatar">
            <div className="as-avatar-circle" style={{background:`linear-gradient(135deg,${bg},${bg}cc)`,boxShadow:`0 6px 20px ${bg}55`}}>
              {username.slice(0,2).toUpperCase()}
            </div>
            <div className="as-nav-name">{displayName}</div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <span className="as-nav-badge"><Shield size={11}/> Administrateur</span>
            </div>
            <div className="as-nav-username">@{username}</div>
          </div>
          <nav className="as-nav-tabs">
            {TABS.map(tab => (
              <button key={tab.key} className={`as-nav-tab${activeTab===tab.key?' active':''}`} onClick={()=>setActiveTab(tab.key)}>
                <span className="as-nav-tab-left">{tab.icon}{tab.label}</span>
                {activeTab===tab.key && <ChevronRight size={14}/>}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Right panel ── */}
        <div className="as-panel">

          {/* ══ PROFIL ══ */}
          {activeTab === 'profil' && (
            <div className="as-card">
              <div className="as-card-header">
                <div className="as-card-icon accent"><User size={18}/></div>
                <div className="as-card-header-text">
                  <h2>Informations personnelles</h2>
                  <p>Mettez à jour vos informations de profil</p>
                </div>
              </div>
              <div className="as-card-body">
                <div className="as-field-grid" style={{marginBottom:16}}>
                  {[{label:'Prénom',key:'prenom',ph:'Jean'},{label:'Nom',key:'nom',ph:'Dupont'}].map(({label,key,ph})=>(
                    <div className="as-field" key={key} style={{marginBottom:0}}>
                      <label className="as-label">{label}</label>
                      <input className="as-input" value={(profile as any)[key]} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))} placeholder={ph}/>
                    </div>
                  ))}
                </div>
                <div className="as-field">
                  <label className="as-label">Identifiant</label>
                  <div className="as-readonly">
                    <User size={15} style={{opacity:.5}}/>
                    <span>@{username}</span>
                    <span className="as-readonly-tag">Non modifiable</span>
                  </div>
                </div>
                <div className="as-field">
                  <label className="as-label">Adresse email</label>
                  <input className="as-input" type="email" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))} placeholder="admin@exemple.ci"/>
                </div>
                <div className="as-card-footer">
                  <button className="as-btn as-btn-accent" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? <span className="as-btn-spinner"/> : <Save size={15}/>}
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ SÉCURITÉ ══ */}
          {activeTab === 'securite' && (
            <div className="as-card">
              <div className="as-card-header">
                <div className="as-card-icon danger"><KeyRound size={18}/></div>
                <div className="as-card-header-text">
                  <h2>Changer le mot de passe</h2>
                  <p>Utilisez un mot de passe fort et unique</p>
                </div>
              </div>
              <div className="as-card-body">
                {pwdError && (
                  <div className="as-error-banner"><AlertCircle size={15} style={{flexShrink:0}}/>{pwdError}</div>
                )}
                <div className="as-field">
                  <label className="as-label">Mot de passe actuel</label>
                  <PwdField value={pwd.old} show={showPwd.old} onChange={v=>setPwd(p=>({...p,old:v}))} onToggle={()=>setShowPwd(s=>({...s,old:!s.old}))} placeholder="Votre mot de passe actuel"/>
                </div>
                <div className="as-divider"/>
                <div className="as-field">
                  <label className="as-label">Nouveau mot de passe</label>
                  <PwdField value={pwd.new} show={showPwd.new} onChange={v=>setPwd(p=>({...p,new:v}))} onToggle={()=>setShowPwd(s=>({...s,new:!s.new}))} placeholder="Min. 8 caractères"/>
                </div>
                {pwd.new && (
                  <div className="as-field">
                    <div className="as-strength-bars">
                      {[1,2,3,4,5].map(i=>(
                        <div key={i} className="as-strength-bar" style={{background:i<=strength.score?strength.color:'var(--border)'}}/>
                      ))}
                    </div>
                    <span className="as-strength-label" style={{color:strength.color}}>{strength.label}</span>
                  </div>
                )}
                <div className="as-field">
                  <label className="as-label">Confirmer le nouveau mot de passe</label>
                  <PwdField value={pwd.confirm} show={showPwd.confirm} onChange={v=>setPwd(p=>({...p,confirm:v}))} onToggle={()=>setShowPwd(s=>({...s,confirm:!s.confirm}))} placeholder="Répéter le mot de passe" danger={!!(pwd.confirm && pwd.confirm !== pwd.new)}/>
                  {pwd.confirm && pwd.confirm !== pwd.new && <p className="as-mismatch">Les mots de passe ne correspondent pas</p>}
                </div>
                <div className="as-card-footer">
                  <button className="as-btn as-btn-danger" onClick={handleChangePassword} disabled={savingPwd}>
                    {savingPwd ? <span className="as-btn-spinner"/> : <Lock size={15}/>}
                    Mettre à jour le mot de passe
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ APPARENCE ══ */}
          {activeTab === 'apparence' && (
            <div className="as-card">
              <div className="as-card-header">
                <div className="as-card-icon blue"><Palette size={18}/></div>
                <div className="as-card-header-text">
                  <h2>Apparence</h2>
                  <p>Personnalisez l'interface</p>
                </div>
              </div>
              <div className="as-card-body">
                <p className="as-section-label">Thème</p>
                <div className="as-theme-grid">
                  <button className={`as-theme-option${!darkMode?' active':''}`} onClick={()=>darkMode&&toggleDarkMode()}>
                    <div className="as-theme-icon light"><Sun size={18} color="#FF8C00"/></div>
                    <div className="as-theme-label">Mode clair</div>
                    <div className="as-theme-desc">Interface lumineuse</div>
                    {!darkMode && <div className="as-theme-active-tag">✓ Actif</div>}
                  </button>
                  <button className={`as-theme-option${darkMode?' active':''}`} onClick={()=>!darkMode&&toggleDarkMode()}>
                    <div className="as-theme-icon dark-icon"><Moon size={18} color="#9B59B6"/></div>
                    <div className="as-theme-label">Mode sombre</div>
                    <div className="as-theme-desc">Interface sombre</div>
                    {darkMode && <div className="as-theme-active-tag">✓ Actif</div>}
                  </button>
                </div>
                <div className="as-toggle-row">
                  <div className="as-toggle-row-left">
                    {darkMode ? <Moon size={20} style={{opacity:.6}}/> : <Sun size={20} color="#FF8C00"/>}
                    <div className="as-toggle-row-text">
                      <strong>Basculer le thème</strong>
                      <span>Actuellement : {darkMode?'mode sombre':'mode clair'}</span>
                    </div>
                  </div>
                  <button className={`as-toggle${darkMode?' on':' off'}`} onClick={toggleDarkMode}>
                    <div className="as-toggle-knob"/>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PwdField({ value, show, onChange, onToggle, placeholder, danger }: {
  value: string; show: boolean; onChange: (v: string) => void;
  onToggle: () => void; placeholder?: string; danger?: boolean;
}) {
  return (
    <div className="as-pwd-wrap">
      <input
        className={`as-input${danger?' danger-border':''}`}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
      />
      <button type="button" className="as-pwd-toggle" onClick={onToggle}>
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  );
}
