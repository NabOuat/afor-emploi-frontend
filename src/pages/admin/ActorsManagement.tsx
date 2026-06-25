import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle, Building2, Phone, Mail, MapPin } from 'lucide-react';
import authService from '../../services/authService';
import { useDarkMode } from '../../hooks/useDarkMode';
import '../../styles/AdminPages.css';

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
  const [dark] = useDarkMode();

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
      const res = await fetch(`${apiUrl}/acteurs`, { headers: authService.getAuthHeader() });
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
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
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
      const res = await fetch(`${apiUrl}/acteurs/${selected.id}`, { method: 'DELETE', headers: authService.getAuthHeader() });
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
    <div className={`ap-page${dark ? ' dark' : ''}`}>

      {toast && (
        <div className={`ap-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.message}
        </div>
      )}

      <div className="ap-header">
        <div className="ap-header-left">
          <h1>Gestion des Acteurs</h1>
          <p>Organismes de Formation, Acteurs de Formation et Responsables</p>
        </div>
        <div className="ap-header-right">
          <button className="ap-btn ap-btn-primary" onClick={openCreate}>
            <Plus size={15} /> Nouvel acteur
          </button>
        </div>
      </div>

      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={15} />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par nom, email, contact…" />
        </div>
        <select className="ap-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="OF">Organisme de Formation (OF)</option>
          <option value="AF">Acteur de Formation (AF)</option>
          <option value="RESPO">Responsable (RESPO)</option>
        </select>
        <span className="ap-count">{filtered.length} / {acteurs.length} acteur(s)</span>
      </div>

      <div className="ap-table-wrap">
        {loading ? (
          <div className="ap-loading">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <Building2 size={40} />
            <p>Aucun acteur trouvé</p>
          </div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>{['Nom', 'Type', 'Contact', 'Email', 'Adresse', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const tc = typeColor(a.type_acteur);
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="ap-card-avatar" style={{ width: 32, height: 32, borderRadius: 8, fontSize: 11, background: tc.bg, color: tc.color }}>
                          {a.nom.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700 }}>{a.nom}</span>
                      </div>
                    </td>
                    <td>
                      <span className="ap-badge" style={{ background: tc.bg, color: tc.color }}>{a.type_acteur}</span>
                      <div style={{ fontSize: 11, marginTop: 2, opacity: 0.6 }}>{TYPE_LABELS[a.type_acteur]}</div>
                    </td>
                    <td>
                      {a.contact_1 && <div className="ap-card-row"><Phone size={12}/>{a.contact_1}</div>}
                      {a.contact_2 && <div className="ap-card-row"><Phone size={12}/>{a.contact_2}</div>}
                      {!a.contact_1 && !a.contact_2 && <span style={{opacity:.4}}>—</span>}
                    </td>
                    <td>
                      {a.email_1 ? <div className="ap-card-row"><Mail size={12}/>{a.email_1}</div> : <span style={{opacity:.4}}>—</span>}
                    </td>
                    <td>
                      {a.adresse_1 ? <div className="ap-card-row"><MapPin size={12}/>{a.adresse_1}</div> : <span style={{opacity:.4}}>—</span>}
                    </td>
                    <td>
                      <div className="ap-card-actions">
                        <button className="ap-icon-btn edit" onClick={() => openEdit(a)} title="Modifier"><Edit2 size={14}/></button>
                        <button className="ap-icon-btn delete" onClick={() => openDelete(a)} title="Supprimer"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="ap-modal-overlay" onClick={closeModal}>
          <div className="ap-modal ap-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>{modal === 'create' ? 'Nouvel acteur' : `Modifier — ${selected?.nom}`}</h2>
              <button className="ap-modal-close" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="ap-modal-body">
              <div className="ap-field-grid">
                <div className="ap-field">
                  <label>Nom *</label>
                  <input className="ap-input" value={form.nom} onChange={e => f('nom', e.target.value)} placeholder="Nom de l'acteur" />
                </div>
                <div className="ap-field">
                  <label>Type *</label>
                  <select className="ap-select" value={form.type_acteur} onChange={e => f('type_acteur', e.target.value)}>
                    <option value="OF">OF — Organisme de Formation</option>
                    <option value="AF">AF — Acteur de Formation</option>
                    <option value="RESPO">RESPO — Responsable</option>
                  </select>
                </div>
              </div>
              <div className="ap-field-grid">
                {([['contact_1','Contact principal','+225 XX XX XX XX'],['contact_2','Contact secondaire','Optionnel']] as const).map(([k,l,p])=>(
                  <div className="ap-field" key={k}><label>{l}</label><input className="ap-input" value={form[k]} onChange={e=>f(k,e.target.value)} placeholder={p}/></div>
                ))}
              </div>
              <div className="ap-field-grid">
                {([['email_1','Email principal','contact@acteur.ci'],['email_2','Email secondaire','Optionnel']] as const).map(([k,l,p])=>(
                  <div className="ap-field" key={k}><label>{l}</label><input type="email" className="ap-input" value={form[k]} onChange={e=>f(k,e.target.value)} placeholder={p}/></div>
                ))}
              </div>
              <div className="ap-field-grid">
                {([['adresse_1','Adresse principale','Abidjan, Plateau'],['adresse_2','Adresse secondaire','Optionnel']] as const).map(([k,l,p])=>(
                  <div className="ap-field" key={k}><label>{l}</label><input className="ap-input" value={form[k]} onChange={e=>f(k,e.target.value)} placeholder={p}/></div>
                ))}
              </div>
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn ap-btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={14}/>{saving ? 'Enregistrement…' : modal === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="ap-modal-overlay" onClick={closeModal}>
          <div className="ap-modal ap-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-body" style={{paddingTop:'1.75rem',paddingBottom:'1.5rem',textAlign:'center'}}>
              <div className="ap-confirm-icon"><Trash2 size={24}/></div>
              <h3 style={{margin:'0 0 8px',fontSize:16,fontWeight:800}}>Supprimer l'acteur ?</h3>
              <p className="ap-confirm-text">L'acteur <span className="ap-confirm-name">{selected.nom}</span> sera définitivement supprimé. Cette action est irréversible.</p>
            </div>
            <div className="ap-modal-footer" style={{justifyContent:'center',gap:10}}>
              <button className="ap-btn ap-btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="ap-btn ap-btn-danger" onClick={handleDelete} disabled={saving}>
                <Trash2 size={14}/>{saving ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
