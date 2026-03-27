import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface Acteur {
  id: string;
  nom: string;
  type_acteur: string;
  contact_1?: string;
  contact_2?: string;
  adresse_1?: string;
  adresse_2?: string;
  email_1?: string;
  email_2?: string;
  date_creation?: string;
}

const EMPTY_FORM: Omit<Acteur, 'id' | 'date_creation'> = {
  nom: '', type_acteur: 'OF',
  contact_1: '', contact_2: '',
  adresse_1: '', adresse_2: '',
  email_1: '', email_2: '',
};

const TYPE_LABELS: Record<string, string> = {
  OF: 'Organisme de Formation',
  AF: 'Acteur de Formation',
  RESPO: 'Responsable',
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  OF:    { bg: 'rgba(255,140,0,0.12)',   color: '#FF8C00' },
  AF:    { bg: 'rgba(52,152,219,0.12)',  color: '#3498DB' },
  RESPO: { bg: 'rgba(39,174,96,0.12)',   color: '#27AE60' },
};

interface Toast { type: 'success' | 'error'; message: string; }

export default function ActorsManagement() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [acteurs, setActeurs]     = useState<Acteur[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast]         = useState<Toast | null>(null);

  // Modal state
  const [modal, setModal]         = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected]   = useState<Acteur | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ────────────────────────────────────────────────────
  const fetchActeurs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/acteurs`);
      if (res.ok) setActeurs(await res.json());
    } catch { showToast('error', 'Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchActeurs(); }, []);

  // ── Filtered list ────────────────────────────────────────────
  const filtered = acteurs.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchSearch = a.nom.toLowerCase().includes(q) ||
      (a.email_1 || '').toLowerCase().includes(q) ||
      (a.contact_1 || '').includes(q);
    const matchType = !filterType || a.type_acteur === filterType;
    return matchSearch && matchType;
  });

  // ── Handlers ─────────────────────────────────────────────────
  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setSelected(null);
    setModal('create');
  };

  const openEdit = (a: Acteur) => {
    setForm({ nom: a.nom, type_acteur: a.type_acteur,
      contact_1: a.contact_1 || '', contact_2: a.contact_2 || '',
      adresse_1: a.adresse_1 || '', adresse_2: a.adresse_2 || '',
      email_1: a.email_1 || '', email_2: a.email_2 || '' });
    setSelected(a);
    setModal('edit');
  };

  const openDelete = (a: Acteur) => { setSelected(a); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.nom.trim()) { showToast('error', 'Le nom est requis'); return; }
    setSaving(true);
    try {
      const isEdit = modal === 'edit' && selected;
      const url  = isEdit ? `${apiUrl}/acteurs/${selected.id}` : `${apiUrl}/acteurs`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur serveur');
      }
      showToast('success', isEdit ? 'Acteur modifié' : 'Acteur créé');
      closeModal();
      fetchActeurs();
    } catch (e: any) {
      showToast('error', e.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/acteurs/${selected.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      showToast('success', `"${selected.nom}" supprimé`);
      closeModal();
      fetchActeurs();
    } catch (e: any) {
      showToast('error', e.message);
    } finally { setSaving(false); }
  };

  const f = (k: keyof typeof EMPTY_FORM, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const typeColor = (t: string) => TYPE_COLORS[t] || { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6' };

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
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d' }}>Gestion des Acteurs</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7a90', fontSize: '0.9rem' }}>
            Organismes de Formation, Acteurs de Formation et Responsables
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #FF8C00, #e07800)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(255,140,0,0.3)',
        }}>
          <Plus size={18} /> Nouvel acteur
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
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, contact…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#1f2d3d', width: '100%' }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid #e8edf3',
            background: '#f8fafc', fontSize: '0.9rem', color: '#1f2d3d', cursor: 'pointer',
          }}
        >
          <option value="">Tous les types</option>
          <option value="OF">Organisme de Formation (OF)</option>
          <option value="AF">Acteur de Formation (AF)</option>
          <option value="RESPO">Responsable (RESPO)</option>
        </select>
        <span style={{ fontSize: '0.85rem', color: '#6b7a90', marginLeft: 'auto' }}>
          {filtered.length} / {acteurs.length} acteur(s)
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>
            <Building2 size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Aucun acteur trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf3' }}>
                {['Nom', 'Type', 'Contact', 'Email', 'Adresse', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem',
                    fontWeight: 700, color: '#6b7a90', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const tc = typeColor(a.type_acteur);
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1f2d3d', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: tc.bg, color: tc.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                        }}>
                          {a.nom.substring(0, 2).toUpperCase()}
                        </div>
                        {a.nom}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: tc.bg, color: tc.color,
                        fontSize: '0.78rem', fontWeight: 700,
                      }}>
                        {a.type_acteur}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#9aa5b4', marginTop: 2 }}>
                        {TYPE_LABELS[a.type_acteur] || a.type_acteur}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {a.contact_1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={12} color="#9aa5b4" /> {a.contact_1}
                        </div>
                      )}
                      {a.contact_2 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <Phone size={12} color="#9aa5b4" /> {a.contact_2}
                        </div>
                      )}
                      {!a.contact_1 && !a.contact_2 && <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {a.email_1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Mail size={12} color="#9aa5b4" /> {a.email_1}
                        </div>
                      )}
                      {!a.email_1 && <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {a.adresse_1 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <MapPin size={12} color="#9aa5b4" /> {a.adresse_1}
                        </div>
                      ) : <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(a)} title="Modifier" style={{
                          padding: '6px 8px', borderRadius: 7, border: 'none',
                          background: 'rgba(52,152,219,0.1)', color: '#3498DB', cursor: 'pointer',
                        }}><Edit2 size={14} /></button>
                        <button onClick={() => openDelete(a)} title="Supprimer" style={{
                          padding: '6px 8px', borderRadius: 7, border: 'none',
                          background: 'rgba(231,76,60,0.1)', color: '#E74C3C', cursor: 'pointer',
                        }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Créer / Modifier ────────────────────────────── */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 560,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #e8edf3',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'rgba(255,140,0,0.12)', color: '#FF8C00',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={18} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1f2d3d' }}>
                  {modal === 'create' ? 'Nouvel acteur' : `Modifier — ${selected?.nom}`}
                </h3>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px 24px' }}>
              {/* Nom + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>
                    Nom <span style={{ color: '#E74C3C' }}>*</span>
                  </label>
                  <input value={form.nom} onChange={e => f('nom', e.target.value)}
                    placeholder="Nom de l'acteur"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                      fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>
                    Type <span style={{ color: '#E74C3C' }}>*</span>
                  </label>
                  <select value={form.type_acteur} onChange={e => f('type_acteur', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                      fontSize: '0.9rem', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="OF">OF — Organisme de Formation</option>
                    <option value="AF">AF — Acteur de Formation</option>
                    <option value="RESPO">RESPO — Responsable</option>
                  </select>
                </div>
              </div>

              {/* Contacts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Contact principal', key: 'contact_1' as const, ph: '+225 XX XX XX XX' },
                  { label: 'Contact secondaire', key: 'contact_2' as const, ph: 'Optionnel' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>{label}</label>
                    <input value={form[key]} onChange={e => f(key, e.target.value)} placeholder={ph}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* Emails */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Email principal', key: 'email_1' as const, ph: 'contact@acteur.ci' },
                  { label: 'Email secondaire', key: 'email_2' as const, ph: 'Optionnel' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>{label}</label>
                    <input type="email" value={form[key]} onChange={e => f(key, e.target.value)} placeholder={ph}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* Adresses */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Adresse principale', key: 'adresse_1' as const, ph: 'Abidjan, Plateau' },
                  { label: 'Adresse secondaire', key: 'adresse_2' as const, ph: 'Optionnel' },
                ].map(({ label, key, ph }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>{label}</label>
                    <input value={form[key]} onChange={e => f(key, e.target.value)} placeholder={ph}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={{
                  padding: '10px 20px', borderRadius: 9, border: '1px solid #e8edf3',
                  background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 9, border: 'none',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #FF8C00, #e07800)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(255,140,0,0.3)',
                }}>
                  {saving
                    ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <Save size={15} />
                  }
                  {modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Suppression ─────────────────────────────────── */}
      {modal === 'delete' && selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420,
            padding: '28px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: 'rgba(231,76,60,0.1)', color: '#E74C3C',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#1f2d3d', fontWeight: 700 }}>
              Supprimer l'acteur ?
            </h3>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#6b7a90', fontSize: '0.9rem' }}>
              <strong>"{selected.nom}"</strong> sera définitivement supprimé.
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeModal} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e8edf3',
                background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={handleDelete} disabled={saving} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                background: saving ? '#ccc' : '#E74C3C',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
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
