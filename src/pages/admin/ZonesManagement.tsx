import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';
import '../../styles/AdminPages.css';

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
interface Toast   { type: 'success' | 'error'; message: string; }

const TYPE_LABELS: Record<string, string> = { AD: 'Admin', AF: 'AFOR', OF: 'Opérateur', RESPO: 'Responsable' };
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  AD:    { bg: 'rgba(155,89,182,0.12)', color: '#9B59B6' },
  AF:    { bg: 'rgba(255,140,0,0.12)',  color: '#FF8C00' },
  OF:    { bg: 'rgba(52,152,219,0.12)', color: '#3498DB' },
  RESPO: { bg: 'rgba(39,174,96,0.12)',  color: '#27AE60' },
};

export default function ZonesManagement() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [dark] = useDarkMode();

  const [zones, setZones]     = useState<Zone[]>([]);
  const [acteurs, setActeurs] = useState<Acteur[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
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
    setApiError('');
    const authHeaders = authService.getAuthHeader();
    try {
      const zRes = await fetch(`${apiUrl}/api/zones-intervention/full`, { headers: authHeaders });
      if (zRes.ok) setZones(await zRes.json());
      else setApiError(`Erreur zones (${zRes.status})`);
    } catch (e: any) { setApiError(`Erreur zones : ${e?.message}`); }

    try {
      const aRes = await fetch(`${apiUrl}/api/acteurs`, { headers: authHeaders });
      if (aRes.ok) setActeurs(await aRes.json());
    } catch { }

    try {
      const pRes = await fetch(`${apiUrl}/api/projets`, { headers: authHeaders });
      if (pRes.ok) setProjets(await pRes.json());
    } catch { }

    try {
      const rRes = await fetch(`${apiUrl}/api/geographic/regions`, { headers: authHeaders });
      if (rRes.ok) setRegions(await rRes.json());
    } catch { }

    setLoading(false);
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

  const openCreate = () => { setForm({ acteur_id: '', projet_id: '', region_id: '' }); setFormError(''); setModal('create'); };
  const openDelete = (z: Zone) => { setSelected(z); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    setFormError('');
    if (!form.acteur_id || !form.projet_id) { setFormError('Acteur et projet sont obligatoires.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/zones-intervention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() },
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
      await fetch(`${apiUrl}/api/zones-intervention/${selected.id}`, { method: 'DELETE', headers: authService.getAuthHeader() });
      showToast('success', 'Affectation retirée.');
      closeModal();
      fetchData();
    } catch { showToast('error', 'Erreur lors de la suppression.'); }
    finally { setSaving(false); }
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
          <h1>Zones d'Intervention</h1>
          <p>Affectations Acteur → Projet → Région — {zones.length} affectation{zones.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="ap-header-right">
          <button className="ap-btn ap-btn-green" onClick={openCreate}><Plus size={15}/> Nouvelle affectation</button>
        </div>
      </div>

      {apiError && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'rgba(231,76,60,0.08)', border:'1px solid rgba(231,76,60,0.3)', borderRadius:8, color:'#E74C3C', fontSize:13, marginBottom:16 }}>
          <AlertCircle size={15} style={{flexShrink:0}}/>
          <span style={{flex:1}}>{apiError}</span>
          <button className="ap-btn ap-btn-green" style={{padding:'4px 10px',fontSize:12}} onClick={fetchData}>Réessayer</button>
        </div>
      )}

      <div className="ap-toolbar">
        <div className="ap-search">
          <Search size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Acteur, projet, région…"/>
        </div>
        <select className="ap-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="ap-count">{filtered.length} / {zones.length} affectation(s)</span>
      </div>

      <div className="ap-table-wrap">
        {loading ? (
          <div className="ap-loading">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty"><Globe size={40}/><p>Aucune affectation trouvée. Créez la première.</p></div>
        ) : (
          <table className="ap-table">
            <thead><tr>{['Acteur','Type','Projet','Région','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((z) => {
                const col = z.type_acteur ? (TYPE_COLORS[z.type_acteur] || { bg:'rgba(100,100,100,0.1)', color:'#666' }) : null;
                return (
                  <tr key={z.id}>
                    <td style={{fontWeight:700}}>{z.acteur_nom || <span style={{opacity:.4}}>—</span>}</td>
                    <td>
                      {col && z.type_acteur
                        ? <span className="ap-badge" style={{background:col.bg,color:col.color}}>{TYPE_LABELS[z.type_acteur]||z.type_acteur}</span>
                        : <span style={{opacity:.4}}>—</span>}
                    </td>
                    <td>{z.projet_nom || <span style={{opacity:.4}}>—</span>}</td>
                    <td>{z.region_nom || <em style={{opacity:.5}}>Nationale</em>}</td>
                    <td>
                      <button className="ap-icon-btn delete" onClick={() => openDelete(z)} title="Retirer"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'create' && (
        <div className="ap-modal-overlay" onClick={closeModal}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>Nouvelle affectation</h2>
              <button className="ap-modal-close" onClick={closeModal}><X size={18}/></button>
            </div>
            <div className="ap-modal-body">
              {formError && (
                <div style={{background:'rgba(231,76,60,0.08)',border:'1px solid rgba(231,76,60,0.3)',borderRadius:6,padding:'8px 12px',marginBottom:12,color:'#E74C3C',fontSize:12,display:'flex',alignItems:'center',gap:6}}>
                  <AlertCircle size={13}/>{formError}
                </div>
              )}
              {([
                { label:'Acteur *', key:'acteur_id', opts: acteurs.map(a=>({v:a.id,l:`${a.nom} (${TYPE_LABELS[a.type_acteur]||a.type_acteur})`})) },
                { label:'Projet *', key:'projet_id', opts: projets.map(p=>({v:p.id,l:p.nom})) },
                { label:'Région (optionnel)', key:'region_id', opts: regions.map(r=>({v:r.id,l:r.nom})) },
              ] as {label:string;key:string;opts:{v:string;l:string}[]}[]).map(({label,key,opts})=>(
                <div className="ap-field" key={key}>
                  <label>{label}</label>
                  <select className="ap-select" value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}>
                    <option value="">— Sélectionner —</option>
                    {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="ap-modal-footer">
              <button className="ap-btn ap-btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="ap-btn ap-btn-green" onClick={handleCreate} disabled={saving}>
                <Plus size={14}/>{saving ? 'Création…' : 'Créer'}
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
              <h3 style={{margin:'0 0 8px',fontSize:16,fontWeight:800}}>Retirer cette affectation ?</h3>
              <p className="ap-confirm-text">
                <span className="ap-confirm-name">{selected.acteur_nom}</span> → <strong>{selected.projet_nom}</strong>
                {selected.region_nom && <><br/><span style={{opacity:.7,fontSize:12}}>Région : {selected.region_nom}</span></>}
              </p>
            </div>
            <div className="ap-modal-footer" style={{justifyContent:'center',gap:10}}>
              <button className="ap-btn ap-btn-ghost" onClick={closeModal}>Annuler</button>
              <button className="ap-btn ap-btn-danger" onClick={handleDelete} disabled={saving}>
                <Trash2 size={14}/>{saving ? 'Suppression…' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
