import { useState, useEffect, useCallback } from 'react';
import {
  Handshake, Plus, Trash2, Link2, X, RefreshCw,
  CheckCircle, AlertCircle, FolderGit2,
} from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import '../../styles/EngagementsManagement.css';

interface Engagement { id: string; nom: string; description: string | null; }
interface Projet { id: string; nom: string; nom_complet?: string | null; }
interface Liaison {
  id: string;
  projet_id: string;
  projet_nom: string;
  engagement_id: string;
  engagement_nom: string;
  date_creation: string;
}
interface Toast { type: 'success' | 'error'; message: string; }

export default function EngagementsManagement() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const { actorType } = useAuth();
  const [dark] = useDarkMode();
  const isAdmin = actorType === 'AD';
  const authHeader = useCallback(() => authService.getAuthHeader(), []);

  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [liaisons, setLiaisons] = useState<Liaison[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  // formulaires
  const [newNom, setNewNom] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [linkProjet, setLinkProjet] = useState('');
  const [linkEngagement, setLinkEngagement] = useState('');
  const [linking, setLinking] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [er, pr, lr] = await Promise.all([
        fetch(`${apiUrl}/api/engagements/`, { headers: authHeader() }),
        fetch(`${apiUrl}/api/projets`, { headers: authHeader() }),
        fetch(`${apiUrl}/api/engagements-liaison/liaisons`, { headers: authHeader() }),
      ]);
      if (er.ok) setEngagements(await er.json());
      if (pr.ok) setProjets(await pr.json());
      if (lr.ok) setLiaisons(await lr.json());
    } catch {
      showToast('error', 'Erreur de chargement des données.');
    } finally { setLoading(false); }
  }, [apiUrl, authHeader]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─────────── Engagements ─────────── */
  const createEngagement = async () => {
    const nom = newNom.trim();
    if (!nom) { showToast('error', 'Le nom est obligatoire.'); return; }
    setCreating(true);
    try {
      const qs = new URLSearchParams({ nom });
      if (newDesc.trim()) qs.append('description', newDesc.trim());
      const r = await fetch(`${apiUrl}/api/engagements/?${qs}`, {
        method: 'POST',
        headers: authHeader(),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Échec de la création.'); return; }
      showToast('success', `Engagement « ${nom} » créé.`);
      setNewNom(''); setNewDesc('');
      fetchAll();
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setCreating(false); }
  };

  const deleteEngagement = async (e: Engagement) => {
    if (!window.confirm(`Supprimer l'engagement « ${e.nom} » ?\nLes liaisons aux projets seront aussi supprimées.`)) return;
    try {
      const r = await fetch(`${apiUrl}/api/engagements/${e.id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Suppression impossible.'); return; }
      showToast('success', `« ${e.nom} » supprimé.`);
      fetchAll();
    } catch { showToast('error', 'Erreur réseau.'); }
  };

  /* ─────────── Liaisons ─────────── */
  const linkEngagementToProject = async () => {
    if (!linkProjet || !linkEngagement) { showToast('error', 'Choisissez un projet et un engagement.'); return; }
    setLinking(true);
    try {
      const qs = new URLSearchParams({ projet_id: linkProjet, engagement_id: linkEngagement });
      const r = await fetch(`${apiUrl}/api/engagements-liaison/link-project?${qs}`, {
        method: 'POST',
        headers: authHeader(),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Échec de la liaison.'); return; }
      showToast('success', 'Liaison créée.');
      setLinkEngagement('');
      fetchAll();
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setLinking(false); }
  };

  const unlink = async (l: Liaison) => {
    try {
      const qs = new URLSearchParams({ projet_id: l.projet_id, engagement_id: l.engagement_id });
      const r = await fetch(`${apiUrl}/api/engagements-liaison/unlink-project?${qs}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Échec.'); return; }
      showToast('success', 'Liaison supprimée.');
      fetchAll();
    } catch { showToast('error', 'Erreur réseau.'); }
  };

  // Liaisons regroupées par projet
  const liaisonsByProjet = projets
    .map(p => ({ projet: p, items: liaisons.filter(l => l.projet_id === p.id) }))
    .filter(g => g.items.length > 0);

  return (
    <div className={`eng-page${dark ? ' dark' : ''}`}>
      <header className="eng-header">
        <div className="eng-header-title">
          <Handshake size={26} />
          <div>
            <h1>Engagements</h1>
            <p>Gérer les engagements et leurs liaisons aux projets</p>
          </div>
        </div>
        <button className="eng-btn ghost" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </header>

      {!isAdmin && (
        <div className="eng-warning">
          <AlertCircle size={16} /> Lecture seule — la création/suppression est réservée aux administrateurs.
        </div>
      )}

      <div className="eng-grid">
        {/* ══════════ Colonne engagements ══════════ */}
        <section className="eng-card">
          <h2><Handshake size={18} /> Engagements ({engagements.length})</h2>

          {isAdmin && (
            <div className="eng-create">
              <input
                type="text"
                placeholder="Nom de l'engagement (ex. ETAT, BAILLEUR…)"
                value={newNom}
                onChange={e => setNewNom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createEngagement()}
              />
              <input
                type="text"
                placeholder="Description (facultatif)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createEngagement()}
              />
              <button className="eng-btn" onClick={createEngagement} disabled={creating}>
                <Plus size={16} /> {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          )}

          <div className="eng-list">
            {loading ? (
              <div className="eng-loading">Chargement…</div>
            ) : engagements.length === 0 ? (
              <div className="eng-empty">Aucun engagement.</div>
            ) : engagements.map(e => (
              <div key={e.id} className="eng-item">
                <div className="eng-item-info">
                  <span className="eng-item-name">{e.nom}</span>
                  {e.description && <span className="eng-item-desc">{e.description}</span>}
                </div>
                {isAdmin && (
                  <button className="eng-icon-btn danger" title="Supprimer" onClick={() => deleteEngagement(e)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ Colonne liaisons ══════════ */}
        <section className="eng-card">
          <h2><Link2 size={18} /> Liaisons projet ↔ engagement</h2>

          {isAdmin && (
            <div className="eng-link-form">
              <select value={linkProjet} onChange={e => setLinkProjet(e.target.value)}>
                <option value="">— Projet —</option>
                {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
              <select value={linkEngagement} onChange={e => setLinkEngagement(e.target.value)}>
                <option value="">— Engagement —</option>
                {engagements.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
              <button className="eng-btn" onClick={linkEngagementToProject} disabled={linking}>
                <Link2 size={16} /> {linking ? 'Liaison…' : 'Lier'}
              </button>
            </div>
          )}

          <div className="eng-liaisons">
            {loading ? (
              <div className="eng-loading">Chargement…</div>
            ) : liaisonsByProjet.length === 0 ? (
              <div className="eng-empty">Aucune liaison.</div>
            ) : liaisonsByProjet.map(({ projet, items }) => (
              <div key={projet.id} className="eng-liaison-group">
                <div className="eng-liaison-projet">
                  <FolderGit2 size={15} /> {projet.nom}
                </div>
                <div className="eng-tags">
                  {items.map(l => (
                    <span key={l.id} className="eng-tag">
                      {l.engagement_nom}
                      {isAdmin && (
                        <button className="eng-tag-x" title="Délier" onClick={() => unlink(l)}>
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {toast && (
        <div className={`eng-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
