import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

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
interface EditForm { nom: string; prenom: string; email: string; acteur_id: string; newPass: string; confirmPass: string; }
interface Toast { type: 'success' | 'error'; message: string; }

const TYPE_LABELS: Record<string, string> = { AD: 'Admin', AF: 'AFOR', OF: 'Opérateur', RESPO: 'Responsable' };
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  AD:    { bg: 'rgba(155,89,182,0.15)', color: '#9B59B6' },
  AF:    { bg: 'rgba(255,140,0,0.15)',  color: '#FF8C00' },
  OF:    { bg: 'rgba(52,152,219,0.15)', color: '#3498DB' },
  RESPO: { bg: 'rgba(39,174,96,0.15)',  color: '#27AE60' },
};
const PALETTE = ['#9B59B6', '#3498DB', '#27AE60', '#E74C3C', '#FF8C00', '#F39C12', '#1ABC9C', '#34495E'];
function avatarBg(s: string) { let h = 0; for (const c of s) h += c.charCodeAt(0); return PALETTE[h % PALETTE.length]; }
const EMPTY_FORM = { username: '', password: '', nom: '', prenom: '', email: '', acteur_id: '' };

/* ══════════════ THEME ══════════════ */
function useTheme(dark: boolean) {
  return {
    page:        dark ? '#10141c' : '#f4f6f9',
    card:        dark ? '#1c2333' : '#ffffff',
    cardAlt:     dark ? '#1e2840' : '#fafbfc',
    input:       dark ? '#252d3d' : '#ffffff',
    inputBorder: dark ? '#3a4560' : '#e8edf3',
    border:      dark ? '#2e3a52' : '#e8edf3',
    borderStrong:dark ? '#3a4560' : '#d0d7e2',
    text:        dark ? '#e8edf3' : '#1f2d3d',
    textSub:     dark ? '#8a98b0' : '#6b7a90',
    textMuted:   dark ? '#4a5568' : '#c0c9d6',
    theadBg:     dark ? '#252d3d' : '#f8fafc',
    overlay:     'rgba(0,0,0,0.6)',
    sectionLabel:dark ? '#5a6a82' : '#9aa5b4',
  };
}

export default function UsersManagement() {
  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');
  const { actorType } = useAuth();
  const [dark] = useDarkMode();
  const t = useTheme(dark);
  const isAdmin = actorType === 'AD';

  const [users, setUsers]         = useState<UserEntry[]>([]);
  const [acteurs, setActeurs]     = useState<Acteur[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast]         = useState<Toast | null>(null);

  const [modal, setModal]         = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected]   = useState<UserEntry | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [editForm, setEditForm]   = useState<EditForm>({ nom: '', prenom: '', email: '', acteur_id: '', newPass: '', confirmPass: '' });
  const [showEditPass, setShowEditPass] = useState(false);

  /* ── utils ── */
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

  /* ── modals ── */
  const openCreate = () => { setForm({ ...EMPTY_FORM }); setFormError(''); setShowPass(false); setModal('create'); };
  const openEdit = (u: UserEntry) => {
    setSelected(u);
    setEditForm({ nom: u.nom || '', prenom: u.prenom || '', email: u.email || '', acteur_id: u.acteur_id || '', newPass: '', confirmPass: '' });
    setShowEditPass(false); setFormError(''); setModal('edit');
  };
  const openDelete = (u: UserEntry) => { setSelected(u); setFormError(''); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setFormError(''); };

  /* ── CRUD ── */
  const handleCreate = async () => {
    setFormError('');
    if (!form.username.trim() || !form.password.trim() || !form.acteur_id) { setFormError('Identifiant, mot de passe et acteur sont obligatoires.'); return; }
    if (form.password.length < 8) { setFormError('Mot de passe : 8 caractères minimum.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setFormError(e.detail || 'Erreur serveur.'); return; }
      showToast('success', 'Compte créé avec succès.'); closeModal(); fetchData();
    } catch { setFormError('Erreur réseau.'); } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setFormError('');
    if (editForm.newPass && editForm.newPass.length < 8) { setFormError('Mot de passe : 8 caractères minimum.'); return; }
    if (editForm.newPass && editForm.newPass !== editForm.confirmPass) { setFormError('Les mots de passe ne correspondent pas.'); return; }
    if (!selected) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { nom: editForm.nom, prenom: editForm.prenom, email: editForm.email, acteur_id: editForm.acteur_id };
      if (editForm.newPass) payload.new_password = editForm.newPass;
      const res = await fetch(`${apiUrl}/api/auth/users/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authService.getAuthHeader() }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setFormError(e.detail || 'Erreur serveur.'); return; }
      showToast('success', `"${selected.username}" mis à jour.`); closeModal(); fetchData();
    } catch { setFormError('Erreur réseau.'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/auth/users/${selected.id}`, { method: 'DELETE', headers: { ...authService.getAuthHeader() } });
      showToast('success', `"${selected.username}" supprimé.`); closeModal(); fetchData();
    } catch { showToast('error', 'Erreur lors de la suppression.'); } finally { setSaving(false); }
  };

  /* ── inline style helpers ── */
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${t.inputBorder}`, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: t.input, color: t.text };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: t.text, marginBottom: 5 };

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: t.page, padding: '24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, background: toast.type === 'success' ? '#27AE60' : '#E74C3C', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: t.text }}>Gestion des Utilisateurs</h1>
          <p style={{ margin: '4px 0 0', color: t.textSub, fontSize: '0.9rem' }}>
            Comptes d'accès à la plateforme — {users.length} compte{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #9B59B6, #8e44ad)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(155,89,182,0.35)' }}>
            <Plus size={18} /> Nouveau compte
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 12px' }}>
          <Search size={16} color={t.textSub} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email, identifiant…"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: t.text, width: '100%' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: '0.9rem', cursor: 'pointer' }}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{ fontSize: '0.85rem', color: t.textSub, marginLeft: 'auto' }}>{filtered.length} / {users.length} compte(s)</span>
      </div>

      {/* Table */}
      <div style={{ background: t.card, borderRadius: 12, border: `1px solid ${t.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>
            <ShieldCheck size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0 }}>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: t.theadBg, borderBottom: `2px solid ${t.border}` }}>
                {['Utilisateur', 'Nom complet', 'Email', 'Acteur', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: t.textSub, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const col = u.type_acteur ? (TYPE_COLORS[u.type_acteur] || { bg: 'rgba(100,100,100,0.1)', color: '#666' }) : null;
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}`, background: i % 2 === 0 ? t.card : t.cardAlt }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: avatarBg(u.username), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: t.text, fontSize: '0.9rem' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: t.textSub }}>
                      {(u.prenom || u.nom) ? `${u.prenom || ''} ${u.nom || ''}`.trim() : <span style={{ color: t.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: t.textSub }}>
                      {u.email || <span style={{ color: t.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.85rem', color: t.textSub, maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.acteur_nom || <span style={{ color: t.textMuted }}>—</span>}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      {col && u.type_acteur ? (
                        <span style={{ padding: '4px 10px', borderRadius: 6, background: col.bg, color: col.color, fontSize: '0.78rem', fontWeight: 700 }}>
                          {TYPE_LABELS[u.type_acteur] || u.type_acteur}
                        </span>
                      ) : <span style={{ color: t.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(u)} style={{ padding: '6px 8px', borderRadius: 7, border: 'none', background: 'rgba(39,174,96,0.12)', color: '#27AE60', cursor: 'pointer' }} title="Modifier"><Pencil size={14} /></button>
                        {isAdmin && (
                          <button onClick={() => openDelete(u)} style={{ padding: '6px 8px', borderRadius: 7, border: 'none', background: 'rgba(231,76,60,0.12)', color: '#E74C3C', cursor: 'pointer' }} title="Supprimer"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ══════════ MODAL CRÉER ══════════ */}
      {modal === 'create' && (
        <Overlay>
          <ModalBox dark={dark} t={t} maxW={500}>
            <MHead icon={<ShieldCheck size={18} />} iconBg="rgba(155,89,182,0.15)" iconColor="#9B59B6" title="Nouveau compte" onClose={closeModal} t={t} />
            <div style={{ padding: '20px 24px' }}>
              <MError msg={formError} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {([['nom','Nom','Dupont'],['prenom','Prénom','Jean']] as [string,string,string][]).map(([k,l,p]) => (
                  <div key={k}><label style={lbl}>{l}</label><input value={(form as any)[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={p} style={inp} /></div>
                ))}
              </div>
              {([['username','Identifiant *','jean.dupont','text'],['email','Email','jean@exemple.ci','email']] as [string,string,string,string][]).map(([k,l,p,tp]) => (
                <div key={k} style={{marginBottom:14}}><label style={lbl}>{l}</label><input type={tp} value={(form as any)[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} placeholder={p} style={inp} /></div>
              ))}
              <div style={{marginBottom:14}}>
                <label style={lbl}>Mot de passe * <span style={{color:t.textSub,fontWeight:400}}>(min. 8 car.)</span></label>
                <PwdInput value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} show={showPass} onToggle={()=>setShowPass(s=>!s)} t={t} />
              </div>
              <div style={{marginBottom:20}}>
                <label style={lbl}>Acteur associé *</label>
                <ActSelect value={form.acteur_id} onChange={v=>setForm(f=>({...f,acteur_id:v}))} acteurs={acteurs} t={t} />
              </div>
              <MFooter onCancel={closeModal} onConfirm={handleCreate} saving={saving} label="Créer le compte" color="#9B59B6" icon={<Plus size={15}/>} t={t} />
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ══════════ MODAL ÉDITER ══════════ */}
      {modal === 'edit' && selected && (
        <Overlay>
          <ModalBox dark={dark} t={t} maxW={520}>
            <MHead icon={<Pencil size={18}/>} iconBg="rgba(39,174,96,0.15)" iconColor="#27AE60" title="Modifier le compte" subtitle={`@${selected.username}`} onClose={closeModal} t={t} />
            <div style={{padding:'20px 24px'}}>
              <MError msg={formError} />

              <MSec t={t}>Informations personnelles</MSec>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                {([['prenom','Prénom','Jean'],['nom','Nom','Dupont']] as [keyof EditForm,string,string][]).map(([k,l,p])=>(
                  <div key={k}><label style={lbl}>{l}</label><input value={editForm[k]} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))} placeholder={p} style={inp} /></div>
                ))}
              </div>
              <div style={{marginBottom:18}}>
                <label style={lbl}>Email</label>
                <input type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))} placeholder="jean@exemple.ci" style={inp} />
              </div>

              <MSec t={t}>Acteur associé</MSec>
              <div style={{marginBottom:18}}>
                <ActSelect value={editForm.acteur_id} onChange={v=>setEditForm(f=>({...f,acteur_id:v}))} acteurs={acteurs} t={t} />
              </div>

              <MSec t={t}>Changer le mot de passe <span style={{fontWeight:400,color:t.textSub,fontSize:'0.8rem',textTransform:'none'}}> — laisser vide pour ne pas modifier</span></MSec>
              <div style={{marginBottom:14}}>
                <label style={lbl}>Nouveau mot de passe <span style={{color:t.textSub,fontWeight:400}}>(min. 8 car.)</span></label>
                <PwdInput value={editForm.newPass} onChange={v=>setEditForm(f=>({...f,newPass:v}))} show={showEditPass} onToggle={()=>setShowEditPass(s=>!s)} t={t} />
              </div>
              <div style={{marginBottom:22}}>
                <label style={lbl}>Confirmer le mot de passe</label>
                <input
                  type={showEditPass?'text':'password'} value={editForm.confirmPass}
                  onChange={e=>setEditForm(f=>({...f,confirmPass:e.target.value}))}
                  placeholder="Répéter le mot de passe"
                  style={{...inp, borderColor: editForm.confirmPass && editForm.confirmPass!==editForm.newPass ? '#E74C3C' : t.inputBorder}}
                />
                {editForm.confirmPass && editForm.confirmPass!==editForm.newPass && (
                  <span style={{fontSize:'0.78rem',color:'#E74C3C',marginTop:4,display:'block'}}>Les mots de passe ne correspondent pas</span>
                )}
              </div>
              <MFooter onCancel={closeModal} onConfirm={handleEdit} saving={saving} label="Enregistrer" color="#27AE60" icon={<Pencil size={15}/>} t={t} />
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ══════════ MODAL SUPPRIMER ══════════ */}
      {modal === 'delete' && selected && (
        <Overlay>
          <ModalBox dark={dark} t={t} maxW={420}>
            <div style={{padding:'28px'}}>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <div style={{width:52,height:52,borderRadius:14,background:'rgba(231,76,60,0.12)',color:'#E74C3C',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Trash2 size={24}/>
                </div>
              </div>
              <h3 style={{margin:'0 0 8px',textAlign:'center',color:t.text,fontWeight:700}}>Supprimer le compte ?</h3>
              <p style={{margin:'0 0 24px',textAlign:'center',color:t.textSub,fontSize:'0.9rem'}}>
                Le compte <strong style={{color:t.text}}>"{selected.username}"</strong> sera définitivement supprimé. Cette action est irréversible.
              </p>
              <div style={{display:'flex',gap:10}}>
                <button onClick={closeModal} style={{flex:1,padding:'10px',borderRadius:9,border:`1px solid ${t.border}`,background:t.card,color:t.textSub,fontSize:'0.9rem',fontWeight:600,cursor:'pointer'}}>Annuler</button>
                <button onClick={handleDelete} disabled={saving} style={{flex:1,padding:'10px',borderRadius:9,border:'none',background:saving?'#ccc':'#E74C3C',color:'#fff',fontSize:'0.9rem',fontWeight:700,cursor:saving?'not-allowed':'pointer'}}>
                  {saving?'Suppression…':'Supprimer'}
                </button>
              </div>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder,textarea::placeholder{color:${dark?'#4a5a70':'#aab4c0'}}`}</style>
    </div>
  );
}

/* ══════════════════ SUB-COMPONENTS ══════════════════ */

type T = ReturnType<typeof useTheme>;

function Overlay({ children }: { children: React.ReactNode }) {
  return <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16 }}>{children}</div>;
}

function ModalBox({ children, t, maxW }: { children: React.ReactNode; dark: boolean; t: T; maxW: number }) {
  return (
    <div style={{ background: t.card, borderRadius: 14, width: '100%', maxWidth: maxW, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${t.border}` }}>
      {children}
    </div>
  );
}

function MHead({ icon, iconBg, iconColor, title, subtitle, onClose, t }: { icon: React.ReactNode; iconBg: string; iconColor: string; title: string; subtitle?: string; onClose: () => void; t: T }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:`1px solid ${t.border}` }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:9,background:iconBg,color:iconColor,display:'flex',alignItems:'center',justifyContent:'center' }}>{icon}</div>
        <div>
          <h3 style={{ margin:0,fontWeight:700,color:t.text,fontSize:'1rem' }}>{title}</h3>
          {subtitle && <p style={{ margin:0,fontSize:'0.82rem',color:t.textSub }}>{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:t.textSub,padding:4 }}><X size={20}/></button>
    </div>
  );
}

function MError({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{ background:'rgba(231,76,60,0.08)',border:'1px solid rgba(231,76,60,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16,color:'#E74C3C',fontSize:'0.88rem',display:'flex',alignItems:'center',gap:8 }}>
      <AlertCircle size={14}/> {msg}
    </div>
  );
}

function MSec({ children, t }: { children: React.ReactNode; t: T }) {
  return <p style={{ margin:'0 0 10px',fontSize:'0.75rem',fontWeight:700,color:t.sectionLabel,textTransform:'uppercase',letterSpacing:'0.6px',borderBottom:`1px solid ${t.border}`,paddingBottom:6 }}>{children}</p>;
}

function PwdInput({ value, onChange, show, onToggle, t, placeholder }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; t: T; placeholder?: string }) {
  return (
    <div style={{ position:'relative' }}>
      <input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||'••••••••'}
        style={{ width:'100%',padding:'9px 40px 9px 12px',borderRadius:8,border:`1px solid ${t.inputBorder}`,fontSize:'0.9rem',outline:'none',boxSizing:'border-box',background:t.input,color:t.text }} />
      <button type="button" onClick={onToggle} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:t.textSub,padding:2 }}>
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  );
}

function ActSelect({ value, onChange, acteurs, t }: { value: string; onChange: (v: string) => void; acteurs: Acteur[]; t: T }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${t.inputBorder}`,fontSize:'0.9rem',background:t.input,color:t.text,cursor:'pointer',boxSizing:'border-box' }}>
      <option value="">— Sélectionner —</option>
      {acteurs.map(a=><option key={a.id} value={a.id}>{a.nom} ({TYPE_LABELS[a.type_acteur]||a.type_acteur})</option>)}
    </select>
  );
}

function MFooter({ onCancel, onConfirm, saving, label, color, icon, t }: { onCancel: () => void; onConfirm: () => void; saving: boolean; label: string; color: string; icon: React.ReactNode; t: T }) {
  return (
    <div style={{ display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4 }}>
      <button onClick={onCancel} style={{ padding:'10px 20px',borderRadius:9,border:`1px solid ${t.border}`,background:'transparent',color:t.textSub,fontSize:'0.9rem',fontWeight:600,cursor:'pointer' }}>Annuler</button>
      <button onClick={onConfirm} disabled={saving} style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:9,border:'none',background:saving?'#aaa':color,color:'#fff',fontSize:'0.9rem',fontWeight:700,cursor:saving?'not-allowed':'pointer',boxShadow:saving?'none':`0 3px 10px ${color}55` }}>
        {saving ? <div style={{ width:14,height:14,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> : icon}
        {label}
      </button>
    </div>
  );
}
