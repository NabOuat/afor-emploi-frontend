import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Trash2, Edit2, Search, X, Download, Upload, ChevronRight, AlertCircle, CheckCircle, Save } from 'lucide-react';

interface Region  { id: string; nom: string; }
interface Dept    { id: string; nom: string; region_id: string; region_nom?: string; }
interface SousP   { id: string; nom: string; departement_id: string; dept_nom?: string; }

type Tab = 'regions' | 'departements' | 'sousprefectures';
const TAB_LABELS: Record<Tab, string> = { regions: 'Régions', departements: 'Départements', sousprefectures: 'Sous-Préfectures' };

interface Toast { type: 'success' | 'error'; message: string; }

export default function GeoManagement() {
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  const [tab, setTab]         = useState<Tab>('regions');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  const [depts, setDepts]     = useState<Dept[]>([]);
  const [sousPs, setSousPs]   = useState<SousP[]>([]);
  const [toast, setToast]     = useState<Toast | null>(null);

  const [modal, setModal]       = useState<{ mode: 'create' | 'edit'; item?: any } | null>(null);
  const [formNom, setFormNom]   = useState('');
  const [formParent, setFormParent] = useState('');
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string; endpoint: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, dRes, sRes] = await Promise.all([
        fetch(`${apiUrl}/api/geographic/regions`),
        fetch(`${apiUrl}/api/geographic/departements`),
        fetch(`${apiUrl}/api/geographic/sousprefectures`),
      ]);
      const r: Region[] = rRes.ok ? await rRes.json() : [];
      const d: Dept[]   = dRes.ok ? await dRes.json() : [];
      const s: SousP[]  = sRes.ok ? await sRes.json() : [];
      setRegions(r);
      setDepts(d.map(dep => ({ ...dep, region_nom: r.find(x => x.id === dep.region_id)?.nom })));
      setSousPs(s.map(sp => ({ ...sp, dept_nom: d.find(x => x.id === sp.departement_id)?.nom })));
    } catch { showToast('error', 'Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { setSearch(''); }, [tab]);

  const filteredRegions = regions.filter(r => r.nom.toLowerCase().includes(search.toLowerCase()));
  const filteredDepts   = depts.filter(d => d.nom.toLowerCase().includes(search.toLowerCase()) || (d.region_nom || '').toLowerCase().includes(search.toLowerCase()));
  const filteredSousPs  = sousPs.filter(s => s.nom.toLowerCase().includes(search.toLowerCase()) || (s.dept_nom || '').toLowerCase().includes(search.toLowerCase()));
  const currentCount = tab === 'regions' ? filteredRegions.length : tab === 'departements' ? filteredDepts.length : filteredSousPs.length;

  const openCreate = () => { setModal({ mode: 'create' }); setFormNom(''); setFormParent(''); setFormError(''); };
  const openEdit   = (item: any) => { setModal({ mode: 'edit', item }); setFormNom(item.nom); setFormParent(item.region_id || item.departement_id || ''); setFormError(''); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    setFormError('');
    if (!formNom.trim()) { setFormError('Le nom est obligatoire.'); return; }
    if (tab !== 'regions' && !formParent) { setFormError('Veuillez sélectionner un parent.'); return; }
    setSaving(true);
    const isEdit = modal?.mode === 'edit';
    let url = `${apiUrl}/api/geographic/`;
    let body: any = {};
    if (tab === 'regions') {
      url += isEdit ? `regions/${modal?.item?.id}` : 'regions';
      body = isEdit ? { id: modal.item.id, nom: formNom } : { id: crypto.randomUUID(), nom: formNom };
    } else if (tab === 'departements') {
      url += isEdit ? `departements/${modal?.item?.id}` : 'departements';
      body = isEdit ? { id: modal.item.id, nom: formNom, region_id: formParent } : { id: crypto.randomUUID(), nom: formNom, region_id: formParent };
    } else {
      url += isEdit ? `sousprefectures/${modal?.item?.id}` : 'sousprefectures';
      body = isEdit ? { id: modal.item.id, nom: formNom, departement_id: formParent } : { id: crypto.randomUUID(), nom: formNom, departement_id: formParent };
    }
    try {
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setFormError(e.detail || 'Erreur.'); return; }
      closeModal();
      showToast('success', isEdit ? 'Modifié avec succès.' : 'Créé avec succès.');
      fetchAll();
    } catch { setFormError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = (id: string, nom: string) => {
    const paths: Record<Tab, string> = { regions: 'regions', departements: 'departements', sousprefectures: 'sousprefectures' };
    setDeleteTarget({ id, nom, endpoint: `${apiUrl}/api/geographic/${paths[tab]}/${id}` });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(deleteTarget.endpoint, { method: 'DELETE' });
      setDeleteTarget(null);
      showToast('success', `"${deleteTarget.nom}" supprimé.`);
      fetchAll();
    } catch { showToast('error', 'Erreur lors de la suppression.'); }
    finally { setDeleting(false); }
  };

  const downloadTemplate = () => window.open(`${apiUrl}/api/geographic/template/${tab}`, '_blank');

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${apiUrl}/api/geographic/import-csv/${tab}`, { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        if (data.created > 0) { showToast('success', `${data.created} élément(s) importé(s).`); fetchAll(); }
        else showToast('error', `Aucun import. ${data.errors.length} erreur(s).`);
      } else { showToast('error', "Erreur lors de l'import."); }
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ''; }
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
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1f2d3d' }}>Gestion Géographique</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7a90', fontSize: '0.88rem', marginTop: 4 }}>
            <span>{regions.length} régions</span>
            <ChevronRight size={14} />
            <span>{depts.length} départements</span>
            <ChevronRight size={14} />
            <span>{sousPs.length} sous-préfectures</span>
          </div>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #2980B9, #1f6fa3)',
          color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 10px rgba(41,128,185,0.3)',
        }}>
          <Plus size={18} /> Créer
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.15s',
            background: tab === t ? '#2980B9' : '#fff',
            color: tab === t ? '#fff' : '#6b7a90',
            border: tab === t ? 'none' : '1px solid #e8edf3',
          } as any}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e8edf3',
        padding: '14px 18px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200,
          background: '#f8fafc', border: '1px solid #e8edf3', borderRadius: 8, padding: '8px 12px' }}>
          <Search size={16} color="#6b7a90" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Rechercher dans ${TAB_LABELS[tab]}…`}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#1f2d3d', width: '100%' }} />
        </div>
        <button onClick={downloadTemplate} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
          border: '1px solid #e8edf3', background: '#f8fafc', color: '#6b7a90', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}>
          <Download size={15} /> Modèle CSV
        </button>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
          border: '1px solid #e8edf3', background: '#f8fafc', color: '#6b7a90', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        }}>
          <Upload size={15} /> {importing ? 'Import…' : 'Importer CSV'}
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} disabled={importing} />
        </label>
        <span style={{ fontSize: '0.85rem', color: '#6b7a90', marginLeft: 'auto' }}>
          {currentCount} élément(s)
        </span>
      </div>

      {/* Import result */}
      {importResult && (
        <div style={{ background: 'rgba(41,128,185,0.06)', border: '1px solid rgba(41,128,185,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: importResult.errors.length ? 8 : 0 }}>
            <span><strong>{importResult.created}</strong> créé(s) · <strong>{importResult.skipped}</strong> ignoré(s)</span>
            <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', color: '#6b7a90', cursor: 'pointer', padding: 2 }}><X size={14} /></button>
          </div>
          {importResult.errors.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#E74C3C' }}>
              {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              {importResult.errors.length > 5 && <li>… et {importResult.errors.length - 5} autre(s)</li>}
            </ul>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>Chargement…</div>
        ) : currentCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7a90' }}>
            <MapPin size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Aucun élément. Créez ou importez depuis un CSV.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8edf3' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#6b7a90', textTransform: 'uppercase', letterSpacing: '.5px' }}>Nom</th>
                {tab !== 'regions' && (
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#6b7a90', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {tab === 'departements' ? 'Région' : 'Département'}
                  </th>
                )}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#6b7a90', textTransform: 'uppercase', letterSpacing: '.5px', width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tab === 'regions' && filteredRegions.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1f2d3d', fontSize: '0.9rem' }}>{r.nom}</td>
                  <td style={{ padding: '13px 16px' }}><RowActions onEdit={() => openEdit(r)} onDelete={() => confirmDelete(r.id, r.nom)} /></td>
                </tr>
              ))}
              {tab === 'departements' && filteredDepts.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1f2d3d', fontSize: '0.9rem' }}>{d.nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>{d.region_nom || <span style={{ color: '#c0c9d6' }}>—</span>}</td>
                  <td style={{ padding: '13px 16px' }}><RowActions onEdit={() => openEdit(d)} onDelete={() => confirmDelete(d.id, d.nom)} /></td>
                </tr>
              ))}
              {tab === 'sousprefectures' && filteredSousPs.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: '#1f2d3d', fontSize: '0.9rem' }}>{s.nom}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: '#4a5568' }}>{s.dept_nom || <span style={{ color: '#c0c9d6' }}>—</span>}</td>
                  <td style={{ padding: '13px 16px' }}><RowActions onEdit={() => openEdit(s)} onDelete={() => confirmDelete(s.id, s.nom)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e8edf3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(41,128,185,0.12)', color: '#2980B9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#1f2d3d' }}>
                  {modal.mode === 'edit' ? 'Modifier' : 'Créer'} — {TAB_LABELS[tab].slice(0, -1)}
                </h3>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a90', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {formError && (
                <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#E74C3C', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>Nom <span style={{ color: '#E74C3C' }}>*</span></label>
                <input value={formNom} onChange={e => setFormNom(e.target.value)} placeholder="Nom de l'élément"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {tab === 'departements' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>Région <span style={{ color: '#E74C3C' }}>*</span></label>
                  <select value={formParent} onChange={e => setFormParent(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="">— Sélectionner —</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                </div>
              )}
              {tab === 'sousprefectures' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#1f2d3d', marginBottom: 5 }}>Département <span style={{ color: '#E74C3C' }}>*</span></label>
                  <select value={formParent} onChange={e => setFormParent(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e8edf3', fontSize: '0.9rem', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="">— Sélectionner —</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.nom} ({d.region_nom})</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid #e8edf3', background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSave} disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 9, border: 'none',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #2980B9, #1f6fa3)',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 10px rgba(41,128,185,0.3)',
                }}>
                  {saving
                    ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    : <Save size={15} />
                  }
                  {modal.mode === 'edit' ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(231,76,60,0.1)', color: '#E74C3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', color: '#1f2d3d', fontWeight: 700 }}>Supprimer ?</h3>
            <p style={{ margin: '0 0 6px', textAlign: 'center', color: '#6b7a90', fontSize: '0.9rem' }}>
              <strong>"{deleteTarget.nom}"</strong> sera définitivement supprimé.
            </p>
            <p style={{ margin: '0 0 24px', textAlign: 'center', color: '#E74C3C', fontSize: '0.82rem' }}>
              ⚠ Les éléments enfants seront aussi supprimés.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e8edf3', background: '#fff', color: '#6b7a90', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: deleting ? '#ccc' : '#E74C3C', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={onEdit} style={{ padding: '6px 8px', borderRadius: 7, border: 'none', background: 'rgba(52,152,219,0.1)', color: '#3498DB', cursor: 'pointer' }} title="Modifier"><Edit2 size={14} /></button>
      <button onClick={onDelete} style={{ padding: '6px 8px', borderRadius: 7, border: 'none', background: 'rgba(231,76,60,0.1)', color: '#E74C3C', cursor: 'pointer' }} title="Supprimer"><Trash2 size={14} /></button>
    </div>
  );
}
