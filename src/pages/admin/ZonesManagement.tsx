import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Search, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Zone {
  id: string;
  acteur_id: string;
  acteur_nom: string | null;
  type_acteur: string | null;
  projet_id: string;
  projet_nom: string | null;
  region_id: string | null;
  region_nom: string | null;
}

interface Acteur  { id: string; nom: string; type_acteur: string; }
interface Projet  { id: string; nom: string; nom_complet: string | null; }
interface Region  { id: string; nom: string; }

const TYPE_LABELS: Record<string, string> = { AD: 'Admin', AF: 'AFOR', OF: 'Opérateur', RESPO: 'Responsable' };
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  AD:    { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6' },
  AF:    { bg: 'rgba(255,140,0,0.12)',  color: '#FF8C00' },
  OF:    { bg: 'rgba(52,152,219,0.12)', color: '#3498DB' },
  RESPO: { bg: 'rgba(39,174,96,0.12)',  color: '#27AE60' },
};

interface Toast { type: 'success' | 'error'; message: string; }

export default function ZonesManagement() {
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  const [zones, setZones]     = useState<Zone[]>([]);
  const [acteurs, setActeurs] = useState<Acteur[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast]     = useState<Toast | null>(null);

  const [modal, setModal]     = useState<'create' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [form, setForm]       = useState({ acteur_id: '', projet_id: '', region_id: '' });
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [z, a, p, r] = await Promise.all([
        fetch(`${apiUrl}/api/zones-intervention/full`),
        fetch(`${apiUrl}/api/acteurs`),
        fetch(`${apiUrl}/api/projets`),
        fetch(`${apiUrl}/api/geographic/regions`),
      ]);
      if (z.ok) setZones(await z.json());
      if (a.ok) setActeurs(await a.json());
      if (p.ok) setProjets(await p.json());
      if (r.ok) setRegions(await r.json());
    } catch { showToast('error', 'Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = zones.filter(z => {
    const q = search.toLowerCase();
    const m = !q ||
      (z.acteur_nom || '').toLowerCase().includes(q) ||
      (z.projet_nom || '').toLowerCase().includes(q) ||
      (z.region_nom || '').toLowerCase().includes(q);
    return m && (!filterType || z.type_acteur === filterType);
  });

  const openCreate = () => {
    setForm({ acteur_id: '', projet_id: '', region_id: '' });
    setFormError('');
    setModal('create');
  };

  const openDelete = (z: Zone) => { setSelected(z); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    setFormError('');
    if (!form.acteur_id || !form.projet_id) { setFormError('Acteur et projet sont obligatoires.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/zones-intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acteur_id: form.acteur_id, projet_id: form.projet_id, region_id: form.region_id || null }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setFormError(e.detail || 'Erreur serveur.'); return; }
      showToast('success', "Zone d'intervention créée.");
      closeModal();
      fetchData();
    } catch { setFormError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/zones-intervention/${selected.id}`, { method: 'DELETE' });
      showToast('success', 'Affectation retirée.');
      closeModal();
      fetchData();
    } catch { showToast('error', 'Erreur lors de la suppression.'); }
    finally { setSaving(false); }
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d' }}>Zones d'Intervention</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7a90', fontSize: '0.9rem' }}>
            Affectations Acteur → Projet → Région — {zones.length} affectation{zones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #27AE60, #219a52)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(39,174,96,0.3)',
        }}>
          <Plus size={18} /> Nouvelle affectation
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
            placeholder="Acteur, projet, région…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#1f2d3d', width: '100%' }}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e8edf3', background: '#f8fafc', fontSize: '0.9rem', color: '#1f2d3d', cursor: 'pointer' }}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ fontSize: '0.85rem', color: '#6b7a90', marginLeft: 'auto' }}>
          {filtered.length} / {zones.length} affectation(s)
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>
            <Globe size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Aucune affectation trouvée. Créez la première.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf3' }}>
                {['Acteur', 'Type', 'Projet', 'Région', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem',
                    fontWeight: 700, color: '#6b7a90', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((z, i) => {
                const col = z.type_acteur ? (TYPE_COLORS[z.type_acteur] || { bg: 'rgba(100,100,100,0.1)', color: '#666' }) : null;
                return (
                  <tr key={z.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1f2d3d', fontSize: '0.9rem' }}>
                      {z.acteur_nom || <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {col && z.type_acteur ? (
                        <span style={{ padding: '4px 10px', borderRadius: 6, background: col.bg, color: col.color, fontSize: '0.78rem', fontWeight: 700 }}>
                          {TYPE_LABELS[z.type_acteur] || z.type_acteur}
                        </span>
                      ) : <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {z.projet_nom || <span style={{ color: '#c0c9d6' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {z.region_nom || <span style={{ color: '#c0c9d6', fontStyle: 'italic' }}>Nationale</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button onClick={() => openDelete(z)} style={{
                        padding: '6px 8px', borderRadius: 7, border: 'none',
                        background: 'rgba(231,76,60,0.1)', color: '#E74C3C', cursor: 'pointer',
                      }} title="Retirer"><Trash2 size={14} /></button>
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
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e8edf3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(39,174,96,0.12)', color: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1f2d3d' }}>Nouvelle affectation</h3>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {formError && (
                <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#E74C3C', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              {[
                { label: 'Acteur *', key: 'acteur_id', opts: acteurs.map(a => ({ v: a.id, l: `${a.nom} (${TYPE_LABELS[a.type_acteur] || a.type_acteur})` })) },
                { label: 'Projet *', key: 'projet_id', opts: projets.map(p => ({ v: p.id, l: p.nom })) },
                { label: 'Région (optionnel)', key: 'region_id', opts: regions.map(r => ({ v: r.id, l: r.nom })) },
              ].map(({ label, key, opts }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>{label}</label>
                  <select value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="">— Sélectionner —</option>
                    {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid #e8edf3', background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleCreate} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 9, border: 'none',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #27AE60, #219a52)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(39,174,96,0.3)',
                }}>
                  {saving
                    ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <Plus size={15} />
                  }
                  Créer
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
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#1f2d3d', fontWeight: 700 }}>Retirer cette affectation ?</h3>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#6b7a90', fontSize: '0.9rem' }}>
              <strong>{selected.acteur_nom}</strong> → <strong>{selected.projet_nom}</strong>
              {selected.region_nom && <><br />Région : {selected.region_nom}</>}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e8edf3', background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDelete} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: saving ? '#ccc' : '#E74C3C', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Suppression…' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
