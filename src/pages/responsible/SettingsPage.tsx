import { useState, useEffect } from 'react';
import {
  User, Lock, Palette, Moon, Sun,
  Save, Eye, EyeOff, CheckCircle, AlertCircle,
  Edit3, Shield, Mail, Send, Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

type Tab = 'profile' | 'security' | 'notifications' | 'appearance';

interface Toast { type: 'success' | 'error' | 'info'; message: string; }

export default function ResponsibleSettingsPage() {
  const { user } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [darkMode, handleToggleDark] = useDarkMode();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast]         = useState<Toast | null>(null);
  const [saving, setSaving]       = useState(false);

  // Profile form
  const [nom,    setNom]    = useState('');
  const [prenom, setPrenom] = useState('');

  // Email / notifications
  const [email,        setEmail]        = useState('');
  const [sendingTest,  setSendingTest]  = useState(false);

  // Password form
  const [oldPwd,  setOldPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [pwdError, setPwdError] = useState('');

  // Load current user data (including email) from API
  useEffect(() => {
    if (!user) return;
    setNom(user.nom || '');
    setPrenom(user.prenom || '');
    // Fetch fresh profile (includes email)
    fetch(`${apiUrl}/auth/me/${user.username}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.email) setEmail(data.email); })
      .catch(() => {});
  }, [user, apiUrl]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Save profile ────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, nom, prenom, email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur serveur');
      }
      const updated = await res.json();
      const stored = sessionStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionStorage.setItem('user', JSON.stringify({ ...parsed, nom: updated.nom, prenom: updated.prenom }));
      }
      showToast('success', 'Profil mis à jour avec succès');
    } catch (e: any) {
      showToast('error', e.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // ── Send test report ─────────────────────────────────────────
  const handleSendTestReport = async () => {
    if (!user || !email) return;
    setSendingTest(true);
    try {
      const res = await fetch(`${apiUrl}/auth/send-test-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur envoi');
      }
      showToast('success', `Rapport de test envoyé à ${email}`);
    } catch (e: any) {
      showToast('error', e.message || "Échec de l'envoi");
    } finally {
      setSendingTest(false);
    }
  };

  // ── Change password ─────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwdError('');
    if (!oldPwd || !newPwd || !confPwd) {
      setPwdError('Tous les champs sont requis');
      return;
    }
    if (newPwd !== confPwd) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, old_password: oldPwd, new_password: newPwd }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur serveur');
      }
      setOldPwd(''); setNewPwd(''); setConfPwd('');
      showToast('success', 'Mot de passe changé avec succès');
    } catch (e: any) {
      setPwdError(e.message || 'Erreur lors du changement');
    } finally {
      setSaving(false);
    }
  };

  // ── Password strength ───────────────────────────────────────
  const pwdStrength = (pwd: string) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Très faible', color: '#E74C3C', w: '20%' };
    if (score === 2) return { label: 'Faible',      color: '#F39C12', w: '40%' };
    if (score === 3) return { label: 'Moyen',       color: '#F39C12', w: '60%' };
    if (score === 4) return { label: 'Fort',        color: '#27AE60', w: '80%' };
    return              { label: 'Très fort',   color: '#1ABC9C', w: '100%' };
  };
  const strength = pwdStrength(newPwd);

  const dark = darkMode;

  // ── Styles ───────────────────────────────────────────────────
  const bg    = dark ? '#111827' : '#f4f6f9';
  const card  = dark ? '#1c2535' : '#ffffff';
  const border = dark ? '#2a3448' : '#e8edf3';
  const text  = dark ? '#e8edf3' : '#1f2d3d';
  const muted = dark ? '#8a98b0' : '#6b7a90';
  const inputBg = dark ? '#151c28' : '#f8fafc';
  const tabActiveBg = dark ? '#2a3448' : '#fff3e8';
  const tabActiveColor = '#FF8C00';

  const tabs: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'profile',       label: 'Profil',         icon: User },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
    { id: 'security',      label: 'Sécurité',       icon: Shield },
    { id: 'appearance',    label: 'Apparence',      icon: Palette },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '24px', transition: 'background 0.3s' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
          background: toast.type === 'success' ? '#27AE60' : '#E74C3C',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          animation: 'fadeInUp .2s ease',
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: text }}>Paramètres</h1>
        <p style={{ margin: '4px 0 0', color: muted, fontSize: '0.9rem' }}>
          Gérez votre profil, sécurité et préférences
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Tab navigation sidebar */}
        <div style={{
          width: 200, flexShrink: 0,
          background: card, borderRadius: 14, border: `1px solid ${border}`,
          padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          {tabs.map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px', border: 'none', borderRadius: 9,
                background: active ? tabActiveBg : 'transparent',
                color: active ? tabActiveColor : muted,
                fontSize: '0.9rem', fontWeight: active ? 700 : 500,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                marginBottom: 2,
              }}>
                <t.icon size={18} />
                {t.label}
                {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: tabActiveColor }} />}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div style={{
          flex: 1, minWidth: 300,
          background: card, borderRadius: 14, border: `1px solid ${border}`,
          padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>

          {/* ── Profile tab ─────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: 'rgba(255,140,0,0.12)', color: '#FF8C00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: text }}>Informations du profil</h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: muted }}>Modifiez vos informations personnelles</p>
                </div>
              </div>

              {/* Read-only username */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: muted, marginBottom: 6 }}>
                  Nom d'utilisateur
                </label>
                <input value={user?.username || ''} readOnly style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: `1px solid ${border}`, background: dark ? '#111827' : '#f0f4f8',
                  color: muted, fontSize: '0.9rem', cursor: 'not-allowed', boxSizing: 'border-box',
                }} />
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: muted }}>
                  Le nom d'utilisateur ne peut pas être modifié
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: text, marginBottom: 6 }}>
                    Prénom
                  </label>
                  <input
                    value={prenom}
                    onChange={e => setPrenom(e.target.value)}
                    placeholder="Votre prénom"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${border}`, background: inputBg,
                      color: text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: text, marginBottom: 6 }}>
                    Nom
                  </label>
                  <input
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                    placeholder="Votre nom"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${border}`, background: inputBg,
                      color: text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Email field */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: text, marginBottom: 6 }}>
                  Adresse email <span style={{ color: '#FF8C00', fontSize: '0.75rem', fontWeight: 500 }}>(rapport hebdomadaire)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: muted }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.com"
                    style={{
                      width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8,
                      border: `1px solid ${border}`, background: inputBg,
                      color: text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: muted }}>
                  Vous recevrez un rapport complet chaque <strong>vendredi à 18h00</strong>
                </p>
              </div>

              {/* Role badge */}
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: dark ? '#1a2436' : '#f0f4f8',
                border: `1px solid ${border}`, marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  padding: '3px 10px', borderRadius: 6,
                  background: 'rgba(255,140,0,0.15)', color: '#FF8C00',
                  fontSize: '0.8rem', fontWeight: 700,
                }}>
                  RESPONSABLE
                </div>
                <span style={{ fontSize: '0.85rem', color: muted }}>
                  Accès lecture — Tous les employés OF+AF
                </span>
              </div>

              <button onClick={handleSaveProfile} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 9, border: 'none',
                background: saving ? '#ccc' : 'linear-gradient(135deg, #FF8C00, #e07800)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 10px rgba(255,140,0,0.3)',
              }}>
                {saving ? <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Save size={16} />}
                Enregistrer le profil
              </button>
            </div>
          )}

          {/* ── Notifications tab ────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: 'rgba(39,174,96,0.12)', color: '#27AE60',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: text }}>Notifications & Rapports</h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: muted }}>Gérez vos rapports automatiques par email</p>
                </div>
              </div>

              {/* Schedule info card */}
              <div style={{
                padding: '16px 20px', borderRadius: 12, marginBottom: 20,
                background: dark ? '#0d1f12' : '#f0fdf4',
                border: '1px solid #27AE60',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(39,174,96,0.15)', color: '#27AE60',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Mail size={16} />
                  </div>
                  <span style={{ fontWeight: 700, color: '#27AE60', fontSize: '0.95rem' }}>
                    Rapport hebdomadaire automatique
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: text, lineHeight: 1.6 }}>
                  Chaque <strong>vendredi à 18h00</strong> (heure d'Abidjan), vous recevez un rapport complet sur l'activité des employés.
                </p>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['KPIs globaux', 'Répartition genre', 'Tranches d\'âge', 'Régions', 'Contrats expirants', 'Nouvelles embauches', 'Formation'].map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(39,174,96,0.12)', color: '#27AE60',
                      fontSize: '0.75rem', fontWeight: 600,
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Email destination */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: text, marginBottom: 6 }}>
                  Email de destination
                </label>
                {email ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 9,
                    background: dark ? '#151c28' : '#f8fafc',
                    border: `1px solid ${border}`,
                  }}>
                    <Mail size={16} color="#27AE60" />
                    <span style={{ fontSize: '0.9rem', color: text, fontWeight: 600 }}>{email}</span>
                    <div style={{
                      marginLeft: 'auto', padding: '2px 8px', borderRadius: 5,
                      background: 'rgba(39,174,96,0.12)', color: '#27AE60',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>Configuré</div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 9,
                    background: 'rgba(231,76,60,0.07)',
                    border: '1px solid rgba(231,76,60,0.3)',
                  }}>
                    <AlertCircle size={16} color="#E74C3C" />
                    <span style={{ fontSize: '0.85rem', color: '#E74C3C' }}>
                      Aucun email configuré — rendez-vous dans l'onglet <strong>Profil</strong> pour en ajouter un.
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: border, margin: '20px 0' }} />

              {/* Test send section */}
              <div style={{
                padding: '18px 20px', borderRadius: 12,
                background: dark ? '#151c28' : '#f8fafc',
                border: `1px solid ${border}`, marginBottom: 8,
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: text, fontSize: '0.95rem' }}>
                  Envoyer un rapport de test
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: muted }}>
                  Recevez immédiatement un rapport avec les statistiques actuelles pour vérifier la mise en page.
                </p>
                <button
                  onClick={handleSendTestReport}
                  disabled={sendingTest || !email}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 22px', borderRadius: 9, border: 'none',
                    background: (!email || sendingTest) ? '#ccc' : 'linear-gradient(135deg, #27AE60, #1e9952)',
                    color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                    cursor: (!email || sendingTest) ? 'not-allowed' : 'pointer',
                    boxShadow: email ? '0 3px 10px rgba(39,174,96,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {sendingTest
                    ? <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <Send size={16} />
                  }
                  {sendingTest ? 'Envoi en cours…' : 'Envoyer le rapport maintenant'}
                </button>
              </div>
            </div>
          )}

          {/* ── Security tab ─────────────────────────────────── */}
          {activeTab === 'security' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: 'rgba(52,152,219,0.12)', color: '#3498DB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: text }}>Changer le mot de passe</h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: muted }}>Mettez à jour votre mot de passe de connexion</p>
                </div>
              </div>

              {[
                { label: 'Mot de passe actuel', val: oldPwd, set: setOldPwd, show: showOld, toggle: () => setShowOld(v => !v) },
                { label: 'Nouveau mot de passe', val: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(v => !v) },
                { label: 'Confirmer le nouveau mot de passe', val: confPwd, set: setConfPwd, show: showConf, toggle: () => setShowConf(v => !v) },
              ].map((field, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: text, marginBottom: 6 }}>
                    {field.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={field.show ? 'text' : 'password'}
                      value={field.val}
                      onChange={e => { field.set(e.target.value); setPwdError(''); }}
                      placeholder="••••••••"
                      style={{
                        width: '100%', padding: '10px 42px 10px 14px', borderRadius: 8,
                        border: `1px solid ${border}`, background: inputBg,
                        color: text, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button onClick={field.toggle} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: 0,
                    }}>
                      {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password strength indicator */}
              {strength && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: muted }}>Force du mot de passe</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: border }}>
                    <div style={{ height: '100%', borderRadius: 3, width: strength.w, background: strength.color, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                </div>
              )}

              {pwdError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                  background: 'rgba(231,76,60,0.1)', color: '#E74C3C', fontSize: '0.85rem',
                  border: '1px solid rgba(231,76,60,0.3)',
                }}>
                  <AlertCircle size={15} /> {pwdError}
                </div>
              )}

              <button onClick={handleChangePassword} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 9, border: 'none',
                background: saving ? '#ccc' : 'linear-gradient(135deg, #3498DB, #2980b9)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 10px rgba(52,152,219,0.3)',
              }}>
                {saving ? <div style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Lock size={16} />}
                Changer le mot de passe
              </button>
            </div>
          )}

          {/* ── Appearance tab ───────────────────────────────── */}
          {activeTab === 'appearance' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: 'rgba(155,89,182,0.12)', color: '#9B59B6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Palette size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: text }}>Apparence</h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: muted }}>Personnalisez l'interface de l'application</p>
                </div>
              </div>

              {/* Dark mode toggle card */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 12,
                background: dark ? '#151c28' : '#f8fafc',
                border: `1px solid ${border}`, marginBottom: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: dark ? 'rgba(255,140,0,0.15)' : 'rgba(31,45,61,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dark ? '#FF8C00' : '#1f2d3d',
                  }}>
                    {dark ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: text, fontSize: '0.9rem' }}>Mode Sombre</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: muted }}>
                      {dark ? 'Thème sombre activé' : 'Thème clair activé'}
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button onClick={handleToggleDark} style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                  background: dark ? '#FF8C00' : '#CBD5E0', transition: 'background 0.25s', padding: 0,
                }}>
                  <span style={{
                    position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    left: dark ? 25 : 3, transition: 'left 0.25s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }} />
                </button>
              </div>

              {/* Theme preview */}
              <div style={{
                padding: '14px 18px', borderRadius: 12, border: `1px solid ${border}`,
                background: dark ? '#151c28' : '#f8fafc',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Edit3 size={14} color={muted} />
                  <span style={{ fontSize: '0.8rem', color: muted, fontWeight: 600 }}>Aperçu du thème</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['#1F2D3D', '#FF8C00', '#27AE60', '#3498DB', '#9B59B6', '#E74C3C'].map(c => (
                    <div key={c} style={{ width: 28, height: 28, borderRadius: 7, background: c, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                  ))}
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: muted }}>
                  Ces couleurs sont utilisées dans les graphiques et exports.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
