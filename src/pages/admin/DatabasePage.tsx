import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, Table2, FileCode2, Upload, Download, RefreshCw,
  CheckCircle, AlertCircle, ChevronDown, FileSpreadsheet, KeyRound, Link2,
  ArrowRightLeft, Eye, Play,
} from 'lucide-react';
import authService from '../../services/authService';
import { useDarkMode } from '../../hooks/useDarkMode';
import '../../styles/DatabasePage.css';

type Tab = 'tables' | 'schema' | 'import' | 'migrate';

interface PresetInfo { key: string; label: string; target: string; note: string; }
interface PreviewResult {
  target_table: string;
  primary_key: string | null;
  source_headers: string[];
  target_columns: string[];
  unmatched_sources: string[];
  uncovered_targets: string[];
  total_rows: number;
  sample: Record<string, unknown>[];
}
interface ExecResult {
  target_table: string;
  total_rows: number;
  ecrits: number;
  ignores: number;
  erreurs: { ligne: number; erreur: string }[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  primary_key: boolean;
}
interface ForeignKey { column: string; references: string; }
interface TableStructure { columns: ColumnInfo[]; foreign_keys: ForeignKey[]; }
interface SheetResult { success: number; errors: { row?: number; nom?: string; error: string }[]; }
interface ImportResult {
  status: string;
  results: Record<string, SheetResult>;
}
interface Toast { type: 'success' | 'error'; message: string; }

const TAB_META: Record<Tab, { label: string; icon: typeof Table2 }> = {
  tables:  { label: 'Voir les tables', icon: Table2 },
  schema:  { label: 'Schéma',          icon: FileCode2 },
  import:  { label: 'Importer',        icon: Upload },
  migrate: { label: 'Migration CSV',   icon: ArrowRightLeft },
};

export default function DatabasePage({ tab = 'tables' }: { tab?: Tab }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const navigate = useNavigate();
  const [dark] = useDarkMode();

  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeader = useCallback(() => authService.getAuthHeader(), []);

  /* ─────────── Onglet : Tables ─────────── */
  const [tables, setTables] = useState<string[]>([]);
  const [stats, setStats] = useState<Record<string, number | null>>({});
  const [loadingTables, setLoadingTables] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const [tr, sr] = await Promise.all([
        fetch(`${apiUrl}/api/admin/tools/db/tables`, { headers: authHeader() }),
        fetch(`${apiUrl}/api/admin/tools/db/stats`, { headers: authHeader() }),
      ]);
      if (!tr.ok) throw new Error('tables');
      const td = await tr.json();
      setTables(td.tables || []);
      if (sr.ok) { const sd = await sr.json(); setStats(sd.stats || {}); }
    } catch {
      showToast('error', "Impossible de charger les tables (réservé aux administrateurs).");
    } finally { setLoadingTables(false); }
  }, [apiUrl, authHeader]);

  /* ─────────── Onglet : Schéma ─────────── */
  const [structure, setStructure] = useState<Record<string, TableStructure>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    setLoadingSchema(true);
    try {
      const r = await fetch(`${apiUrl}/api/admin/tools/db/structure`, { headers: authHeader() });
      if (!r.ok) throw new Error('structure');
      const d = await r.json();
      setStructure(d.structure || {});
    } catch {
      showToast('error', 'Impossible de charger le schéma.');
    } finally { setLoadingSchema(false); }
  }, [apiUrl, authHeader]);

  useEffect(() => {
    if (tab === 'tables') fetchTables();
    if (tab === 'schema') fetchSchema();
  }, [tab, fetchTables, fetchSchema]);

  /* ─────────── Téléchargements ─────────── */
  const downloadFile = async (url: string, fallbackName: string) => {
    try {
      const r = await fetch(url, { headers: authHeader() });
      if (!r.ok) { showToast('error', `Échec du téléchargement (HTTP ${r.status}).`); return; }
      const blob = await r.blob();
      const cd = r.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename=([^;]+)/);
      const name = m ? m[1].trim().replace(/"/g, '') : fallbackName;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { showToast('error', 'Erreur réseau pendant le téléchargement.'); }
  };

  /* ─────────── Onglet : Import ─────────── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');

  const handleImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch(`${apiUrl}/api/import-export/import-all`, {
        method: 'POST',
        headers: { ...authHeader() },
        body: fd,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Échec de l\'import.'); return; }
      setImportResult(d);
      const total = Object.values(d.results || {}).reduce((s: number, v) => s + (v as SheetResult).success, 0);
      showToast('success', `Import terminé : ${total} enregistrement(s) traité(s).`);
    } catch { showToast('error', 'Erreur réseau pendant l\'import.'); }
    finally { setImporting(false); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFileName(f.name); handleImport(f); }
  };

  /* ─────────── Onglet : Migration CSV ─────────── */
  const [presets, setPresets] = useState<PresetInfo[]>([]);
  const [mode, setMode] = useState<'preset' | 'table'>('preset');
  const [selPreset, setSelPreset] = useState('');
  const [selTable, setSelTable] = useState('');
  const [migFile, setMigFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [execResult, setExecResult] = useState<ExecResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (tab !== 'migrate') return;
    fetch(`${apiUrl}/api/admin/import/presets`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : { presets: [] })
      .then(d => setPresets(d.presets || []))
      .catch(() => {});
    if (tables.length === 0) fetchTables();
  }, [tab, apiUrl, authHeader, tables.length, fetchTables]);

  const buildForm = () => {
    if (!migFile) { showToast('error', 'Choisissez un fichier CSV.'); return null; }
    const fd = new FormData();
    fd.append('file', migFile);
    if (mode === 'preset') {
      if (!selPreset) { showToast('error', 'Choisissez un preset.'); return null; }
      fd.append('preset', selPreset);
    } else {
      if (!selTable) { showToast('error', 'Choisissez une table cible.'); return null; }
      fd.append('target_table', selTable);
    }
    return fd;
  };

  const doPreview = async () => {
    const fd = buildForm(); if (!fd) return;
    setBusy(true); setPreview(null); setExecResult(null);
    try {
      const r = await fetch(`${apiUrl}/api/admin/import/preview`, { method: 'POST', headers: authHeader(), body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Échec de la prévisualisation.'); return; }
      setPreview(d);
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setBusy(false); }
  };

  const doExecute = async () => {
    const fd = buildForm(); if (!fd) return;
    if (!window.confirm('Importer ces données ? Les lignes dont l\'id existe déjà seront écrasées.')) return;
    setBusy(true); setExecResult(null);
    try {
      const r = await fetch(`${apiUrl}/api/admin/import/execute`, { method: 'POST', headers: authHeader(), body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { showToast('error', d.detail || 'Échec de l\'import.'); return; }
      setExecResult(d);
      showToast('success', `Import terminé : ${d.ecrits} ligne(s) écrite(s).`);
    } catch { showToast('error', 'Erreur réseau.'); }
    finally { setBusy(false); }
  };

  /* ─────────── Rendu ─────────── */
  return (
    <div className={`db-page${dark ? ' dark' : ''}`}>
      <header className="db-header">
        <div className="db-header-title">
          <Database size={26} />
          <div>
            <h1>Base de données</h1>
            <p>Inspection, schéma et import des données — accès administrateur</p>
          </div>
        </div>
      </header>

      {/* Sous-navigation par onglets */}
      <nav className="db-tabs">
        {(Object.keys(TAB_META) as Tab[]).map(k => {
          const M = TAB_META[k];
          return (
            <button
              key={k}
              className={`db-tab${tab === k ? ' active' : ''}`}
              onClick={() => navigate(`/admin/database/${k}`)}
            >
              <M.icon size={17} /> {M.label}
            </button>
          );
        })}
      </nav>

      {/* ══════════ TABLES ══════════ */}
      {tab === 'tables' && (
        <section className="db-section">
          <div className="db-section-bar">
            <span className="db-count">{tables.length} table(s)</span>
            <div className="db-actions">
              <button className="db-btn ghost" onClick={fetchTables} disabled={loadingTables}>
                <RefreshCw size={15} className={loadingTables ? 'spin' : ''} /> Actualiser
              </button>
              <button
                className="db-btn"
                onClick={() => downloadFile(`${apiUrl}/api/admin/tools/export/schema`, 'schema.sql')}
              >
                <FileCode2 size={15} /> Exporter le schéma (.sql)
              </button>
            </div>
          </div>

          {loadingTables ? (
            <div className="db-loading">Chargement…</div>
          ) : (
            <div className="db-table-grid">
              {tables.map(t => (
                <div key={t} className="db-table-card">
                  <div className="db-table-card-head">
                    <Table2 size={18} />
                    <span className="db-table-name">{t}</span>
                  </div>
                  <div className="db-table-card-meta">
                    <span className="db-rows">
                      {stats[t] != null ? `${stats[t]} ligne(s)` : '—'}
                    </span>
                    <button
                      className="db-btn sm"
                      title="Exporter en CSV"
                      onClick={() => downloadFile(`${apiUrl}/api/admin/tools/export/data/${t}`, `${t}.csv`)}
                    >
                      <Download size={14} /> CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════ SCHÉMA ══════════ */}
      {tab === 'schema' && (
        <section className="db-section">
          <div className="db-section-bar">
            <span className="db-count">{Object.keys(structure).length} table(s)</span>
            <div className="db-actions">
              <button className="db-btn ghost" onClick={fetchSchema} disabled={loadingSchema}>
                <RefreshCw size={15} className={loadingSchema ? 'spin' : ''} /> Actualiser
              </button>
            </div>
          </div>

          {loadingSchema ? (
            <div className="db-loading">Chargement du schéma…</div>
          ) : (
            <div className="db-schema-list">
              {Object.entries(structure).sort((a, b) => a[0].localeCompare(b[0])).map(([table, s]) => {
                const open = expanded === table;
                return (
                  <div key={table} className="db-schema-item">
                    <button
                      className={`db-schema-head${open ? ' open' : ''}`}
                      onClick={() => setExpanded(open ? null : table)}
                    >
                      <FileCode2 size={16} />
                      <span className="db-schema-name">{table}</span>
                      <span className="db-schema-colcount">{s.columns.length} colonnes</span>
                      <ChevronDown size={16} className={`db-chevron${open ? ' open' : ''}`} />
                    </button>
                    {open && (
                      <div className="db-schema-body">
                        <table className="db-cols">
                          <thead>
                            <tr><th>Colonne</th><th>Type</th><th>Null</th><th>Défaut</th></tr>
                          </thead>
                          <tbody>
                            {s.columns.map(c => (
                              <tr key={c.name}>
                                <td className="db-col-name">
                                  {c.primary_key && <KeyRound size={13} className="db-pk" />}
                                  {c.name}
                                </td>
                                <td><code>{c.type}</code></td>
                                <td>{c.nullable ? 'oui' : 'non'}</td>
                                <td className="db-col-default">{c.default || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {s.foreign_keys.length > 0 && (
                          <div className="db-fk-list">
                            {s.foreign_keys.map((fk, i) => (
                              <span key={i} className="db-fk">
                                <Link2 size={12} /> {fk.column} → {fk.references}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ══════════ IMPORT ══════════ */}
      {tab === 'import' && (
        <section className="db-section">
          <div className="db-import-card">
            <FileSpreadsheet size={40} className="db-import-icon" />
            <h2>Import complet (Excel multi-onglets)</h2>
            <p>
              Téléchargez le modèle, remplissez chaque onglet dans l'ordre indiqué dans la feuille
              <strong> Instructions</strong>, puis importez le fichier <code>.xlsx</code>.
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Onglets disponibles : <strong>Acteurs</strong> → <strong>Projets</strong> →{' '}
              <strong>Engagements</strong> → <strong>Employes</strong> → <strong>Zones_Intervention</strong>
            </p>

            <div className="db-import-actions">
              <button
                className="db-btn ghost"
                onClick={() => downloadFile(`${apiUrl}/api/import-export/download-template`, 'template_afor.xlsx')}
              >
                <Download size={16} /> Télécharger le modèle
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
              <button
                className="db-btn"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
              >
                <Upload size={16} /> {importing ? 'Import en cours…' : 'Choisir un fichier'}
              </button>
            </div>
            {fileName && <p className="db-filename">Fichier : {fileName}</p>}
          </div>

          {importResult && (
            <div className="db-import-result">
              {Object.entries(importResult.results || {}).map(([sheet, res]) => (
                <div key={sheet} style={{ marginBottom: '1rem' }}>
                  <div className="db-result-stats">
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{sheet}</span>
                    <span className="db-stat ok"><CheckCircle size={14} /> {res.success} importé(s)</span>
                    {res.errors.length > 0 && (
                      <span className="db-stat err"><AlertCircle size={14} /> {res.errors.length} erreur(s)</span>
                    )}
                  </div>
                  {res.errors.length > 0 && (
                    <ul className="db-error-list">
                      {res.errors.slice(0, 20).map((e, i) => (
                        <li key={i}>
                          {e.row ? `Ligne ${e.row}` : ''}{e.nom ? ` (${e.nom})` : ''}{(e.row || e.nom) ? ' : ' : ''}{e.error}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════ MIGRATION CSV ══════════ */}
      {tab === 'migrate' && (
        <section className="db-section">
          <div className="db-migrate-form">
            <div className="db-mig-row">
              <label className="db-mig-label">Cible</label>
              <div className="db-mig-modes">
                <label className={`db-radio${mode === 'preset' ? ' active' : ''}`}>
                  <input type="radio" checked={mode === 'preset'} onChange={() => setMode('preset')} />
                  Preset AFOR (transformation)
                </label>
                <label className={`db-radio${mode === 'table' ? ' active' : ''}`}>
                  <input type="radio" checked={mode === 'table'} onChange={() => setMode('table')} />
                  Table directe (mapping par nom)
                </label>
              </div>
            </div>

            {mode === 'preset' ? (
              <div className="db-mig-row">
                <label className="db-mig-label">Preset</label>
                <select value={selPreset} onChange={e => setSelPreset(e.target.value)} className="db-mig-select">
                  <option value="">— Choisir —</option>
                  {presets.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            ) : (
              <div className="db-mig-row">
                <label className="db-mig-label">Table</label>
                <select value={selTable} onChange={e => setSelTable(e.target.value)} className="db-mig-select">
                  <option value="">— Choisir —</option>
                  {tables.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {mode === 'preset' && selPreset && (
              <p className="db-mig-note">{presets.find(p => p.key === selPreset)?.note}</p>
            )}

            <div className="db-mig-row">
              <label className="db-mig-label">Fichier CSV</label>
              <input
                type="file"
                accept=".csv,.txt"
                className="db-mig-file"
                onChange={e => { setMigFile(e.target.files?.[0] || null); setPreview(null); setExecResult(null); }}
              />
            </div>

            <div className="db-actions">
              <button className="db-btn ghost" onClick={doPreview} disabled={busy}>
                <Eye size={15} /> Prévisualiser
              </button>
              <button className="db-btn" onClick={doExecute} disabled={busy || !preview}>
                <Play size={15} /> Importer
              </button>
            </div>
          </div>

          {/* Aperçu */}
          {preview && (
            <div className="db-mig-preview">
              <h3>Aperçu — cible <code>{preview.target_table}</code> ({preview.total_rows} ligne(s), clé <code>{preview.primary_key}</code>)</h3>
              {preview.unmatched_sources.length > 0 && (
                <p className="db-mig-warn">
                  <AlertCircle size={14} /> Colonnes source ignorées : {preview.unmatched_sources.join(', ')}
                </p>
              )}
              {preview.sample.length > 0 && (
                <div className="db-mig-table-wrap">
                  <table className="db-cols">
                    <thead>
                      <tr>{Object.keys(preview.sample[0]).map(k => <th key={k}>{k}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.sample.map((row, i) => (
                        <tr key={i}>
                          {Object.keys(preview.sample[0]).map(k => (
                            <td key={k}>{row[k] == null ? '—' : String(row[k])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Résultat */}
          {execResult && (
            <div className="db-import-result">
              <div className="db-result-stats">
                <span className="db-stat ok"><CheckCircle size={16} /> {execResult.ecrits} écrite(s)</span>
                <span className="db-stat total">{execResult.total_rows} ligne(s) lues</span>
                {execResult.ignores > 0 && <span className="db-stat total">{execResult.ignores} ignorée(s)</span>}
                {execResult.erreurs.length > 0 && (
                  <span className="db-stat err"><AlertCircle size={16} /> {execResult.erreurs.length} erreur(s)</span>
                )}
              </div>
              {execResult.erreurs.length > 0 && (
                <ul className="db-error-list">
                  {execResult.erreurs.slice(0, 50).map((e, i) => (
                    <li key={i}>Ligne {e.ligne} : {e.erreur}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {toast && (
        <div className={`db-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
