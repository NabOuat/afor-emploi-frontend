import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Trash2, Edit2, Search, X, Download, Upload, ChevronRight, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';
import '../../styles/AdminPages.css';

interface Region  { id: string; nom: string; }
interface Dept    { id: string; nom: string; region_id: string; region_nom?: string; }
interface SousP   { id: string; nom: string; departement_id: string; dept_nom?: string; }
interface Toast   { type: 'success' | 'error'; message: string; }

type Tab = 'regions' | 'departements' | 'sousprefectures';
const TAB_LABELS: Record<Tab, string> = { regions: 'Régions', departements: 'Départements', sousprefectures: 'Sous-Préfectures' };

export default function GeoManagement() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [dark] = useDarkMode();

  const [tab, setTab]         = useState<Tab>('regions');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [depts, setDepts]     = useState<Dept[]>([]);
  const [sousPs, setSousPs]   = useState<SousP[]>([]);
  const [toast, setToast]     = useState<Toast | null>(null);

  const [modal, setModal]           = useState<{ mode: 'create' | 'edit'; item?: any } | null>(null);
  const [formNom, setFormNom]       = useState('');
  const [formParent, setFormParent] = useState('');
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string; endpoint: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = async () => {
    setLoading(true);
    setApiError('');
    const authHeaders = authService.getAuthHeader();
    try {
      const [rRes, dRes, sRes] = await Promise.all([
        fetch(`${apiUrl}/api/geographic/regions`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/geographic/departements`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/geographic/sousprefectures`, { headers: authHeaders }),
      ]);
      const r: Region[] = rRes.ok ? await rRes.json() : [];
      const d: Dept[]   = dRes.ok ? await dRes.json() : [];
      const s: SousP[]  = sRes.ok ? await sRes.json() : [];
      if (!rRes.ok) setApiError(`Erreur régions (${rRes.status})`);
      else if (r.length === 0 && d.length === 0) setApiError('API accessible mais aucune donnée reçue (tables vides ?)');
      setRegions(r);
      setDepts(d.map(dep => ({ ...dep, region_nom: r.find(x => x.id === dep.region_id)?.nom })));
      setSousPs(s.map(sp => ({ ...sp, dept_nom: d.find(x => x.id === sp.departement_id)?.nom })));
    } catch (e: any) {
      setApiError(`Erreur réseau : ${e?.message || 'serveur inaccessible'}`);
    } finally {
      setLoading(false);
    }
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
      body = isEdit ? { id: modal!.item.id, nom: formNom } : { id: crypto.randomUUID(), nom: formNom };
    } else if (tab === 'departements') {
      url += isEdit ? `departements/${modal?.item?.id}` : 'departements';
      body = isEdit ? { id: modal!.item.id, nom: formNom, region_id: formParent } : { id: crypto.randomUUID(), nom: formNom, region_id: formParent };
    } else {
      url += isEdit ? `sousprefectures/${modal?.item?.id}` : 'sousprefectures';
      body = isEdit ? { id: modal!.item.id, nom: formNom, departement_id: formParent } : { id: crypto.randomUUID(), nom: formNom, departement_id: formParent };
    }
    try {
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() }, body: JSON.stringify(body) });
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
      await fetch(deleteTarget.endpoint, { method: 'DELETE', headers: authService.getAuthHeader() });
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
      const res = await fetch(`${apiUrl}/api/geographic/import-csv/${tab}`, { method: 'POST', headers: authService.getAuthHeader(), body: fd });
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
    <div className={`ap-page${dark ? ' dark' : ''}`}>

      {toast && (
        <div className={`ap-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
          {toast.message}
        </div>
      )}

      <div className="ap-header">
        <div className="ap-header-left">
          <h1>Gestion Géographique</h1>
          <p style={{display:'flex',alignItems:'center',gap:5}}>
            {regions.length} régions <ChevronRight size={13}/> {depts.length} départements <ChevronRight size={13}/> {sousPs.length} sous-préfectures
          </p>
        </div>
        <div className="ap-header-right">
          <button className="ap-btn ap-btn-blue" onClick={openCreate}><Plus size={15}/> Créer</button>
        </div>
      </div>

      {apiError && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',background:'rgba(231,76,60,0.08)',border:'1px solid rgba(231,76,60,0.3)',borderRadius:8,color:'#E74C3C',fontSize:13,marginBottom:16}}>
          <AlertCircle size={15} style={{flexShrink:0}}/>
          <span style={{flex:1}}>{apiError}</span>
          <button className="ap-btn ap-btn-blue" style={{padding:'4px 10px',fontSize:12}} onClick={fetchAll}>Réessayer</button>
        </div>
      )}

      {/* Onglets */}
      <div style={{display:'flex',gap:4,marginBottom:14}}>
        {(Object.keys(TAB_LABELS) as Tab[]).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`ap-btn${tab === tabKey ? ' ap-btn-blue' : ' ap-btn-ghost'}`}
            style={{fontSize:13}}>
            {TAB_LABELS[tabKey]}
          </button>
        ))}
      </div>

      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Rechercher dans ${TAB_LABELS[tab]}…`}/>
        </div>
        <button className="ap-btn ap-btn-ghost" onClick={downloadTemplate}><Download size={14}/> Modèle CSV</button>
        <label className="ap-btn ap-btn-ghost" style={{cursor:'pointer'}}>
          <Upload size={14}/> {importing ? 'Import…' : 'Importer CSV'}
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleImport} disabled={importing}/>
        </label>
        <span className="ap-count">{currentCount} élément(s)</span>
      </div>

      {importResult && (
        <div style={{background:'rgba(41,128,185,0.08)',border:'1px solid rgba(41,128,185,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:13}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span><strong>{importResult.created}</strong> créé(s) · <strong>{importResult.skipped}</strong> ignoré(s)</span>
            <button onClick={()=>setImportResult(null)} style={{background:'none',border:'none',cursor:'pointer',opacity:.5}}><X size={14}/></button>
          </div>
          {importResult.errors.length > 0 && (
            <ul style={{margin:'6px 0 0',paddingLeft:'1.2rem',color:'#E74C3C',fontSize:12}}>
              {importResult.errors.slice(0,5).map((e,i)=><li key={i}>{e}</li>)}
              {importResult.errors.length>5 && <li>… et {importResult.errors.length-5} autre(s)</li>}
            </ul>
          )}
        </div>
      )}

      <div className="ap-table-wrap">
        {loading ? (
          <div className="ap-loading">Chargement…</div>
        ) : currentCount === 0 ? (
          <div className="ap-empty"><MapPin size={40}/><p>Aucun élément. Créez ou importez depuis un CSV.</p></div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>Nom</th>
                {tab !== 'regions' && <th>{tab === 'departements' ? 'Région' : 'Département'}</th>}
                <th style={{width:100}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tab === 'regions' && filteredRegions.map(r => (
                <tr key={r.id}><td style={{fontWeight:700}}>{r.nom}</td><td><RowActions onEdit={()=>openEdit(r)} onDelete={()=>confirmDelete(r.id,r.nom)}/></td></tr>
              ))}
              {tab === 'departements' && filteredDepts.map(d => (
                <tr key={d.id}><td style={{fontWeight:700}}>{d.nom}</td><td>{d.region_nom||<span style={{opacity:.4}}>—</span>}</td><td><RowActions onEdit={()=>openEdit(d)} onDelete={()=>confirmDelete(d.id,d.nom)}/></td></tr>
              ))}
              {tab === 'sousprefectures' && filteredSousPs.map(s => (
                <tr key={s.id}><td style={{fontWeight:700}}>{s.nom}</td><td>{s.dept_nom||<span style={{opacity:.4}}>—</span>}</td><td><RowActions onEdit={()=>openEdit(s)} onDelete={()=>confirmDelete(s.id,s.nom)}/></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="ap-modal-overlay" onClick={closeModal}>
          <div className="ap-modal" onClick={e=>e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>{modal.mode === 'edit' ? 'Modifier' : 'Créer'} — {TAB_LABELS[tab].slice(0,-1)}</h2>
              <button className="ap-modal-close" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="ap-modal-body">
              {formError && (
                <div style={{background:'rgba(231,76,60,0.08)',border:'1px solid rgba(231,76,60,0.3)',borderRadius:6,padding:'8px 12px',marginBottom:12,color:'#E74C3C',fontSize:12,display:'flex',alignItems:'center',gap:6}}>
                  <AlertCircle size={13}/>{formError}
                </div>
              )}
              <div className="ap-field">
                <label>Nom *</label>
                <input className="ap-input" value={formNom} onChange={e=>setFormNom(e.target.value)} placeholder="Nom de l'élément"/>
              </div>
              {tab === 'departements' && (
                <div className="ap-field">
                  <label>Région *</label>
                  <select className="ap-select" value={formParent} onChange={e=>setFormParent(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {regions.map(r=><option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                </div>
              )}
              {tab === 'sousprefectures' && (
                <div className="ap-field">
                  <label>Département *</label>
                  <select className="ap-select" value={formParent} onChange={e=>setFormParent(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {depts.map(d=><option key={d.id} value={d.id}>{d.nom} ({d.region_nom})</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn ap-btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="ap-btn ap-btn-blue" onClick={handleSave} disabled={saving}>
                <Save size={14}/>{saving ? 'Enregistrement…' : modal.mode === 'edit' ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="ap-modal-overlay" onClick={()=>setDeleteTarget(null)}>
          <div className="ap-modal ap-modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="ap-modal-body" style={{paddingTop:'1.75rem',paddingBottom:'1.5rem',textAlign:'center'}}>
              <div className="ap-confirm-icon"><Trash2 size={24}/></div>
              <h3 style={{margin:'0 0 8px',fontSize:16,fontWeight:800}}>Supprimer ?</h3>
              <p className="ap-confirm-text"><span className="ap-confirm-name">{deleteTarget.nom}</span> sera définitivement supprimé.</p>
              <p style={{color:'#E74C3C',fontSize:11,margin:'6px 0 0',fontWeight:600}}>⚠ Les éléments enfants seront aussi supprimés.</p>
            </div>
            <div className="ap-modal-footer" style={{justifyContent:'center',gap:10}}>
              <button className="ap-btn ap-btn-ghost" onClick={()=>setDeleteTarget(null)}>Annuler</button>
              <button className="ap-btn ap-btn-danger" onClick={handleDelete} disabled={deleting}>
                <Trash2 size={14}/>{deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="ap-card-actions">
      <button className="ap-icon-btn edit" onClick={onEdit} title="Modifier"><Edit2 size={14}/></button>
      <button className="ap-icon-btn delete" onClick={onDelete} title="Supprimer"><Trash2 size={14}/></button>
    </div>
  );
}
