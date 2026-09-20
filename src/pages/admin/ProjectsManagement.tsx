import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';
import authService from '../../services/authService';
import { useDarkMode } from '../../hooks/useDarkMode';
import '../../styles/AdminPages.css';

interface Projet {
  id: string;
  nom: string;
  nom_complet?: string;
}

const EMPTY_FORM = { nom: '', nom_complet: '' };

interface Toast { type: 'success' | 'error'; message: string; }

export default function ProjectsManagement() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [dark] = useDarkMode();

  const [projets, setProjets]       = useState<Projet[]>([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast]           = useState<Toast | null>(null);

  const [modal, setModal]           = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected]     = useState<Projet | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProjets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/projets`, { headers: authService.getAuthHeader() });
      if (res.ok) setProjets(await res.json());
    } catch { showToast('error', 'Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjets(); }, []);

  const filtered = projets.filter(p => {
    const q = searchTerm.toLowerCase();
    return p.nom.toLowerCase().includes(q) || (p.nom_complet || '').toLowerCase().includes(q);
  });

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setSelected(null); setModal('create'); };
  const openEdit   = (p: Projet) => { setForm({ nom: p.nom, nom_complet: p.nom_complet || '' }); setSelected(p); setModal('edit'); };
  const openDelete = (p: Projet) => { setSelected(p); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.nom.trim()) { showToast('error', 'Le nom abrégé est requis'); return; }
    setSaving(true);
    try {
      const isEdit = modal === 'edit' && selected;
      const res = await fetch(isEdit ? `${apiUrl}/projets/${selected.id}` : `${apiUrl}/projets`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Erreur serveur'); }
      showToast('success', isEdit ? 'Projet modifié' : 'Projet créé');
      closeModal();
      fetchProjets();
    } catch (e: any) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/projets/${selected.id}`, { method: 'DELETE', headers: authService.getAuthHeader() });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      showToast('success', `"${selected.nom}" supprimé`);
      closeModal();
      fetchProjets();
    } catch (e: any) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  const PALETTE = ['#FF8C00','#3498DB','#27AE60','#9B59B6','#E74C3C','#1ABC9C','#F39C12','#2980B9'];
  const color = (i: number) => PALETTE[i % PALETTE.length];

  return (
    <div className={`ap-page${dark ? ' dark' : ''}`}>

      {toast && (
        <div className={`ap-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
          {toast.message}
        </div>
      )}

      <div className="ap-header">
        <div className="ap-header-left">
          <h1>Gestion des Projets</h1>
          <p>Créez et gérez les projets associés aux acteurs et employés</p>
        </div>
        <div className="ap-header-right">
          <button className="ap-btn ap-btn-blue" onClick={openCreate}>
            <Plus size={15}/> Nouveau projet
          </button>
        </div>
      </div>

      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={15}/>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher par nom ou intitulé complet…"/>
        </div>
        <span className="ap-count">{filtered.length} / {projets.length} projet(s)</span>
      </div>

      {loading ? (
        <div className="ap-loading">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="ap-empty">
          <FolderOpen size={40}/>
          <p>Aucun projet trouvé</p>
        </div>
      ) : (
        <div className="ap-grid">
          {filtered.map((p, i) => (
            <div key={p.id} className="ap-card" style={{ borderTop: `3px solid ${color(i)}` }}>
              <div className="ap-card-header">
                <div className="ap-card-avatar" style={{ background: `${color(i)}22`, color: color(i) }}>
                  {p.nom.substring(0, 3).toUpperCase()}
                </div>
                <div>
                  <p className="ap-card-title">{p.nom}</p>
                  {p.nom_complet && <p className="ap-card-sub">{p.nom_complet}</p>}
                </div>
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--v3-bg,#F0F4FA)', border: '1px solid var(--v3-border,#E2E8F0)' }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '.3px' }}>ID</p>
                <p style={{ margin: '1px 0 0', fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>{p.id}</p>
              </div>
              <div className="ap-card-footer">
                <div className="ap-card-actions">
                  <button className="ap-icon-btn edit" onClick={() => openEdit(p)} title="Modifier"><Edit2 size={14}/></button>
                  <button className="ap-icon-btn delete" onClick={() => openDelete(p)} title="Supprimer"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="ap-modal-overlay" onClick={closeModal}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>{modal === 'create' ? 'Nouveau projet' : `Modifier — ${selected?.nom}`}</h2>
              <button className="ap-modal-close" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="ap-modal-body">
              <div className="ap-field">
                <label>Nom abrégé *</label>
                <input className="ap-input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: PROFOR, AGRI-CI…"/>
              </div>
              <div className="ap-field">
                <label>Intitulé complet</label>
                <textarea className="ap-input" value={form.nom_complet} onChange={e => setForm(f => ({ ...f, nom_complet: e.target.value }))} placeholder="Nom complet du projet…" rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }}/>
              </div>
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn ap-btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="ap-btn ap-btn-blue" onClick={handleSave} disabled={saving}>
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
              <h3 style={{margin:'0 0 8px',fontSize:16,fontWeight:800}}>Supprimer le projet ?</h3>
              <p className="ap-confirm-text">Le projet <span className="ap-confirm-name">{selected.nom}</span> sera définitivement supprimé. Les employés liés ne seront pas supprimés.</p>
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
