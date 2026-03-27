import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle, FolderOpen } from 'lucide-react';

interface Projet {
  id: string;
  nom: string;
  nom_complet?: string;
}

const EMPTY_FORM = { nom: '', nom_complet: '' };

interface Toast { type: 'success' | 'error'; message: string; }

export default function ProjectsManagement() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
      const res = await fetch(`${apiUrl}/projets`);
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
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${apiUrl}/projets/${selected.id}`, { method: 'DELETE' });
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
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d' }}>Gestion des Projets</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7a90', fontSize: '0.9rem' }}>
            Créez et gérez les projets associés aux acteurs et employés
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #3498DB, #2980b9)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(52,152,219,0.3)',
        }}>
          <Plus size={18} /> Nouveau projet
        </button>
      </div>

      {/* Search */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e8edf3',
        padding: '14px 18px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1,
          background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 8, padding: '8px 12px' }}>
          <Search size={16} color="#6b7a90" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom ou intitulé complet…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#1f2d3d', width: '100%' }}
          />
        </div>
        <span style={{ fontSize: '0.85rem', color: '#6b7a90', whiteSpace: 'nowrap' }}>
          {filtered.length} / {projets.length} projet(s)
        </span>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>
          <FolderOpen size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
          <p style={{ margin: 0 }}>Aucun projet trouvé</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map((p, i) => (
            <div key={p.id} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #e8edf3',
              overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ height: 5, background: color(i) }} />
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: `${color(i)}1a`, color: color(i),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800,
                  }}>
                    {p.nom.substring(0, 3).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, color: '#1f2d3d', fontSize: '0.95rem' }}>{p.nom}</p>
                    {p.nom_complet && (
                      <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#6b7a90', lineHeight: 1.4 }}>
                        {p.nom_complet}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '7px 10px', borderRadius: 7,
                  background: '#f8fafc', border: '1px solid #f0f4f8', marginBottom: 14,
                }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#9aa5b4', fontWeight: 600 }}>ID</p>
                  <p style={{ margin: '1px 0 0', fontSize: '0.75rem', color: '#6b7a90', fontFamily: 'monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.id}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(p)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, border: '1px solid #e8edf3',
                    background: '#fff', color: '#3498DB', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Edit2 size={13} /> Modifier
                  </button>
                  <button onClick={() => openDelete(p)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, border: '1px solid #fce8e8',
                    background: '#fff8f8', color: '#E74C3C', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Créer / Modifier */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #e8edf3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9,
                  background: 'rgba(52,152,219,0.12)', color: '#3498DB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderOpen size={18} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1f2d3d' }}>
                  {modal === 'create' ? 'Nouveau projet' : `Modifier — ${selected?.nom}`}
                </h3>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>
                  Nom abrégé <span style={{ color: '#E74C3C' }}>*</span>
                </label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: PROFOR, AGRI-CI…"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9aa5b4' }}>
                  Identifiant court utilisé dans les listes et exports
                </p>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>
                  Intitulé complet
                </label>
                <textarea value={form.nom_complet}
                  onChange={e => setForm(f => ({ ...f, nom_complet: e.target.value }))}
                  placeholder="Nom complet du projet…" rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e8edf3',
                    fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={{
                  padding: '10px 20px', borderRadius: 9, border: '1px solid #e8edf3',
                  background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                }}>Annuler</button>
                <button onClick={handleSave} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 9, border: 'none',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #3498DB, #2980b9)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(52,152,219,0.3)',
                }}>
                  {saving ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Save size={15} />}
                  {modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {modal === 'delete' && selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400,
            padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14,
                background: 'rgba(231,76,60,0.1)', color: '#E74C3C',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#1f2d3d', fontWeight: 700 }}>
              Supprimer le projet ?
            </h3>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#6b7a90', fontSize: '0.9rem' }}>
              <strong>"{selected.nom}"</strong> sera définitivement supprimé.
              Les employés liés à ce projet ne seront pas supprimés.
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
