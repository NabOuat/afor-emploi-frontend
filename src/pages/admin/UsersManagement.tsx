import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';
import authService from '../../services/authService';

interface UserEntry {
  id: string;
  username: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  acteur_id: string;
  acteur_nom: string | null;
  type_acteur: string | null;
}

interface Acteur { id: string; nom: string; type_acteur: string; }

const TYPE_LABELS: Record<string, string> = { AD: 'Admin', AF: 'AFOR', OF: 'Opérateur', RESPO: 'Responsable' };
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  AD:    { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6' },
  AF:    { bg: 'rgba(255,140,0,0.12)',  color: '#FF8C00' },
  OF:    { bg: 'rgba(52,152,219,0.12)', color: '#3498DB' },
  RESPO: { bg: 'rgba(39,174,96,0.12)',  color: '#27AE60' },
};

const PALETTE = ['#9B59B6', '#3498DB', '#27AE60', '#E74C3C', '#FF8C00', '#F39C12', '#1ABC9C', '#34495E'];
function avatarBg(s: string) { let h = 0; for (const c of s) h += c.charCodeAt(0); return PALETTE[h % PALETTE.length]; }

const EMPTY_FORM = { username: '', password: '', nom: '', prenom: '', email: '', acteur_id: '' };

interface Toast { type: 'success' | 'error'; message: string; }

export default function UsersManagement() {
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  const [users, setUsers]           = useState<UserEntry[]>([]);
  const [acteurs, setActeurs]       = useState<Acteur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast]           = useState<Toast | null>(null);

  const [modal, setModal]           = useState<'create' | 'delete' | null>(null);
  const [selected, setSelected]     = useState<UserEntry | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [showPass, setShowPass]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ur, ar] = await Promise.all([
        fetch(`${apiUrl}/api/auth/users`, { headers: { ...authService.getAuthHeader() } }),
        fetch(`${apiUrl}/api/acteurs`),
      ]);
      if (ur.ok) setUsers(await ur.json());
      if (ar.ok) setActeurs(await ar.json());
    } catch { showToast('error', 'Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const m = !q || u.username.toLowerCase().includes(q) ||
      (u.nom || '').toLowerCase().includes(q) ||
      (u.prenom || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.acteur_nom || '').toLowerCase().includes(q);
    return m && (!filterType || u.type_acteur === filterType);
  });

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setShowPass(false);
    setModal('create');
  };

  const openDelete = (u: UserEntry) => { setSelected(u); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    setFormError('');
    if (!form.username.trim() || !form.password.trim() || !form.acteur_id) {
      setFormError('Identifiant, mot de passe et acteur sont obligatoires.');
      return;
    }
    if (form.password.length < 8) { setFormError('Mot de passe : 8 caractères minimum.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setFormError(e.detail || 'Erreur serveur.'); return; }
      showToast('success', 'Compte créé avec succès.');
      closeModal();
      fetchData();
    } catch { setFormError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/auth/users/${selected.id}`, { method: 'DELETE', headers: { ...authService.getAuthHeader() } });
      showToast('success', `"${selected.username}" supprimé.`);
      closeModal();
      fetchData();
    } catch { showToast('error', 'Erreur lors de la suppression.'); }
    finally { setSaving(false); }
  };

  const tc = (t: string | null) => t ? (TYPE_COLORS[t] || { bg: 'rgba(100,100,100,0.1)', color: '#666' }) : null;

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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d' }}>Gestion des Utilisateurs</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7a90', fontSize: '0.9rem' }}>
            Comptes d'accès à la plateforme — {users.length} compte{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #9B59B6, #8e44ad)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(155,89,182,0.3)',
        }}>
          <Plus size={18} /> Nouveau compte
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e8edf3',
        padding: '14px 18px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200,
          background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 8, padding: '8px 12px' }}>
          <Search size={16} color="#6b7a90" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, identifiant…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#1f2d3d', width: '100%' }}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e8edf3', background: '#f8fafc', fontSize: '0.9rem', color: '#1f2d3d', cursor: 'pointer' }}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ fontSize: '0.85rem', color: '#6b7a90', marginLeft: 'auto' }}>
          {filtered.length} / {users.length} compte(s)
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>
            <ShieldCheck size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf3' }}>
                {['Utilisateur', 'Nom complet', 'Email', 'Acteur', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem',
                    fontWeight: 700, color: '#6b7a90', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const col = tc(u.type_acteur);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                          background: avatarBg(u.username), color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800,
                        }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: '#1f2d3d', fontSize: '0.9rem' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {(u.prenom || u.nom) ? `${u.prenom || ''} ${u.nom || ''}`.trim() : <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {u.email || <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {u.acteur_nom || <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {col && u.type_acteur ? (
                        <span style={{ padding: '4px 10px', borderRadius: 6, background: col.bg, color: col.color, fontSize: '0.78rem', fontWeight: 700 }}>
                          {TYPE_LABELS[u.type_acteur] || u.type_acteur}
                        </span>
                      ) : <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => openDelete(u)} style={{
                        padding: '6px 8px', borderRadius: 7, border: 'none',
                        background: 'rgba(231,76,60,0.1)', color: '#E74C3C', cursor: 'pointer',
                      }} title="Supprimer"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e8edf3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(155,89,182,0.12)', color: '#9B59B6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1f2d3d' }}>Nouveau compte utilisateur</h3>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {formError && (
                <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#E74C3C', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Nom', key: 'nom', ph: 'Dupont' },
                  { label: 'Prénom', key: 'prenom', ph: 'Jean' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>{label}</label>
                    <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {[
                { label: 'Identifiant *', key: 'username', ph: 'jean.dupont', type: 'text' },
                { label: 'Email', key: 'email', ph: 'jean@exemple.ci', type: 'email' },
              ].map(({ label, key, ph, type }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>Mot de passe * <span style={{ color: '#9aa5b4', fontWeight: 400 }}>(min. 8 caractères)</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••"
                    style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90', padding: 2 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>Acteur associé *</label>
                <select value={form.acteur_id} onChange={e => setForm(f => ({ ...f, acteur_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="">— Sélectionner —</option>
                  {acteurs.map(a => <option key={a.id} value={a.id}>{a.nom} ({TYPE_LABELS[a.type_acteur] || a.type_acteur})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid #e8edf3', background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleCreate} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 9, border: 'none',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #9B59B6, #8e44ad)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(155,89,182,0.3)',
                }}>
                  {saving
                    ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <Plus size={15} />
                  }
                  Créer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(231,76,60,0.1)', color: '#E74C3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#1f2d3d', fontWeight: 700 }}>Supprimer le compte ?</h3>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#6b7a90', fontSize: '0.9rem' }}>
              Le compte <strong>"{selected.username}"</strong> sera définitivement supprimé. Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e8edf3', background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDelete} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: saving ? '#ccc' : '#E74C3C', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
