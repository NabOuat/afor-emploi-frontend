import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Upload, Users, TrendingUp, Download, X, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import ZoomPlugin from 'chartjs-plugin-zoom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import '../../styles/OperatorDashboard.css';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler, ZoomPlugin);

// ── Cache sessionStorage 5 minutes ─────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
function getCache(acteurId: string, filter: string) {
  try {
    const raw = sessionStorage.getItem(`op_dash_${acteurId}_${filter}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? data : null;
  } catch { return null; }
}
function setCache(acteurId: string, filter: string, data: unknown) {
  try {
    sessionStorage.setItem(`op_dash_${acteurId}_${filter}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}
function clearDashCache(acteurId: string) {
  ['all', 'active'].forEach(f => sessionStorage.removeItem(`op_dash_${acteurId}_${f}`));
}

const C = ['#FF8C00', '#3498DB', '#27AE60', '#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C'];

interface DashboardStats {
  total_employees: number;
  active_contracts: number;
  young_employees_over_25: number;
  last_login: string | null;
}

interface EmployeesByPosition { position: string; count: number; }
interface EmployeesByZone     { zone_id: string; region: string; departement: string; count: number; }
interface ContractStatus      { active: number; completed: number; upcoming: number; }
interface AverageContractDuration { average_days: number; average_months: number; total_contracts: number; }
interface EmployeesByProject  { project_id: string; project_name: string; count: number; }
interface EmployeesByGender   { gender: string; count: number; percentage: number; }
interface AgeStatistics       { average_age: number; min_age: number; max_age: number; age_groups: Record<string, number>; }
interface MonthlyHire         { month: string; count: number; }

interface ImportProgress {
  total: number;
  success: number;
  errors: Array<{ row: number; error: string }>;
  employees: Array<{ nom: string; prenom: string; poste: string }>;
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { logout: _logout } = useAuth();
  const [darkMode] = useDarkMode();
  const [filterType,        setFilterType]         = useState<'all' | 'active'>('all');
  const [isLoading,         setIsLoading]          = useState(true);
  const [apiError,          setApiError]           = useState<string | null>(null);
  const [stats,             setStats]              = useState<DashboardStats | null>(null);
  const [employeesByPosition, setEmployeesByPosition] = useState<EmployeesByPosition[]>([]);
  const [employeesByZone,   setEmployeesByZone]    = useState<EmployeesByZone[]>([]);
  const [employeesByProject,setEmployeesByProject] = useState<EmployeesByProject[]>([]);
  const [employeesByGender, setEmployeesByGender]  = useState<EmployeesByGender[]>([]);
  const [ageStats,          setAgeStats]           = useState<AgeStatistics | null>(null);
  const [contractStatus,    setContractStatus]     = useState<ContractStatus | null>(null);
  const [avgContractDuration, setAvgContractDuration] = useState<AverageContractDuration | null>(null);
  const [monthlyHires,      setMonthlyHires]       = useState<MonthlyHire[]>([]);
  const [showImportModal,   setShowImportModal]    = useState(false);
  const [importProgress,    setImportProgress]     = useState<ImportProgress | null>(null);
  const [isImporting,       setIsImporting]        = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyData = useCallback((d: {
    stats: DashboardStats;
    employees_by_position: EmployeesByPosition[];
    employees_by_zone: EmployeesByZone[];
    contract_status: ContractStatus;
    average_contract_duration: AverageContractDuration;
    employees_by_project: EmployeesByProject[];
    employees_by_gender: EmployeesByGender[];
    age_statistics: AgeStatistics;
    monthly_hires: MonthlyHire[];
  }) => {
    setStats(d.stats);
    setEmployeesByPosition(d.employees_by_position);
    setEmployeesByZone(d.employees_by_zone);
    setContractStatus(d.contract_status);
    setAvgContractDuration(d.average_contract_duration);
    setEmployeesByProject(d.employees_by_project);
    setEmployeesByGender(d.employees_by_gender);
    setAgeStats(d.age_statistics);
    setMonthlyHires(d.monthly_hires);
  }, []);

  const fetchDashboardData = useCallback(async (acteurId: string, filter: string = 'all', forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCache(acteurId, filter);
      if (cached) { applyData(cached); setIsLoading(false); return; }
    }

    setIsLoading(true);
    setApiError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const authHeaders = authService.getAuthHeader();

      // ── Essai endpoint combiné (optimisé) ──────────────────────────────
      const res = await fetch(`${apiUrl}/dashboard/operator/all/${acteurId}?filter_type=${filter}`, { headers: authHeaders });
      if (res.status === 401) { navigate('/login'); return; }
      if (res.ok) {
        const data = await res.json();
        setCache(acteurId, filter, data);
        applyData(data);
        return;
      }

      const errCode = res.status;

      // ── Fallback : 9 endpoints parallèles (ancien comportement) ────────
      const [sR, pR, zR, cR, aR, prR, gR, agR, hR] = await Promise.all([
        fetch(`${apiUrl}/dashboard/operator/stats/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/employees-by-position/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/employees-by-zone/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/contract-status/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/average-contract-duration/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/employees-by-project/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/employees-by-gender/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/age-statistics/${acteurId}?filter_type=${filter}`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/monthly-hires/${acteurId}?months=12`, { headers: authHeaders }),
      ]);

      const anyOk = [sR, pR, zR, cR, aR, prR, gR, agR, hR].some(r => r.ok);
      if (!anyOk) {
        setApiError(`Impossible de contacter le serveur (code ${errCode}). Vérifiez que le backend est démarré.`);
        return;
      }

      const [sd, pd, zd, cd, ad, prd, gd, agd, hd] = await Promise.all([
        sR.ok  ? sR.json()  : Promise.resolve(null),
        pR.ok  ? pR.json()  : Promise.resolve([]),
        zR.ok  ? zR.json()  : Promise.resolve([]),
        cR.ok  ? cR.json()  : Promise.resolve(null),
        aR.ok  ? aR.json()  : Promise.resolve(null),
        prR.ok ? prR.json() : Promise.resolve([]),
        gR.ok  ? gR.json()  : Promise.resolve([]),
        agR.ok ? agR.json() : Promise.resolve(null),
        hR.ok  ? hR.json()  : Promise.resolve([]),
      ]);
      const combined = {
        stats: sd, employees_by_position: pd, employees_by_zone: zd,
        contract_status: cd, average_contract_duration: ad,
        employees_by_project: prd, employees_by_gender: gd,
        age_statistics: agd, monthly_hires: hd,
      };
      setCache(acteurId, filter, combined);
      applyData(combined);
    } catch {
      setApiError('Serveur inaccessible — vérifiez que le backend est démarré sur le port 8000.');
    } finally {
      setIsLoading(false);
    }
  }, [applyData]);

  const handleRefresh = () => {
    const acteurId = sessionStorage.getItem('acteur_id');
    if (!acteurId) return;
    clearDashCache(acteurId);
    fetchDashboardData(acteurId, filterType, true);
  };

  useEffect(() => {
    const token    = sessionStorage.getItem('token');
    const acteurId = sessionStorage.getItem('acteur_id');
    if (!token || !acteurId) { navigate('/login'); return; }
    fetchDashboardData(acteurId, filterType);
  }, [navigate, fetchDashboardData, filterType]);

  const handleDownloadTemplate = async () => {
    try {
      const apiUrl   = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/import-export/download-template`, { headers: authService.getAuthHeader() });
      if (!response.ok) throw new Error('Erreur téléchargement');
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `template_employes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setNotificationMessage('Template téléchargé avec succès!');
      setTimeout(() => setNotificationMessage(''), 3000);
    } catch {
      setNotificationMessage('Erreur lors du téléchargement');
      setTimeout(() => setNotificationMessage(''), 3000);
    }
  };

  const handleImportExcel = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setShowImportModal(true);
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const acteurId = sessionStorage.getItem('acteur_id');
      const apiUrl   = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/import-export/import-employees?acteur_id=${acteurId}&projet_id=default`, {
        method: 'POST', headers: authService.getAuthHeader(), body: formData,
      });
      if (!response.ok) throw new Error('Erreur import');
      const result = await response.json();
      setImportProgress(result);
      setNotificationMessage(`${result.success}/${result.total} employés importés avec succès`);
      if (acteurId) {
        clearDashCache(acteurId);
        const apiUrl2 = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        fetch(`${apiUrl2}/dashboard/operator/cache/${acteurId}`, { method: 'DELETE', headers: authService.getAuthHeader() }).catch(() => {});
        setTimeout(() => fetchDashboardData(acteurId, filterType), 1000);
      }
    } catch {
      setNotificationMessage("Erreur lors de l'import du fichier");
    } finally {
      setIsImporting(false);
    }
  };

  const tk = darkMode ? '#8B949E' : '#718096';
  const gr = darkMode ? '#30363D' : '#E2E8F0';

  const statCards = [
    { label: 'Total Employés',     value: stats?.total_employees || 0,                                                   icon: Users,       color: '#3498DB', description: 'Employés enregistrés' },
    { label: 'Contrats Actifs',    value: stats?.active_contracts || 0,                                                  icon: CheckCircle, color: '#27AE60', description: 'Contrats en cours' },
    { label: 'Employés > 25 ans',  value: stats?.young_employees_over_25 || 0,                                           icon: TrendingUp,  color: '#F39C12', description: 'Plus de 25 ans' },
    { label: 'Contrats Expirés',   value: contractStatus ? contractStatus.completed : 0,                                 icon: AlertCircle, color: '#E74C3C', description: contractStatus ? (contractStatus.completed > 0 ? 'Urgent' : 'Aucun') : '—' },
  ];

  const emptyChart = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#8a98b0', fontSize: '0.82rem' }}>
      Aucune donnée — {label}
    </div>
  );

  return (
    <div className={`operator-dashboard${darkMode ? ' dark-mode' : ''}`}>
      <div className="operator-main">

        {/* Header V3 */}
        <div className="operator-header">
          <div className="header-content">
            <h1>Tableau de bord <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem', padding: '2px 10px', borderRadius: 999, background: '#3498DB', color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', verticalAlign: 'middle' }}>OF</span></h1>
            <p>Suivi des employés et contrats de votre organisme</p>
          </div>
          <div className="header-buttons">
            <select value={filterType} onChange={e => setFilterType(e.target.value as 'all' | 'active')} className="filter-select">
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
            </select>
            <button className="btn-primary" onClick={handleRefresh} title="Rafraîchir"><RefreshCw size={15} /></button>
            <button className="btn-primary" onClick={handleDownloadTemplate}><Download size={15} />Importer CSV</button>
            <button className="btn-primary" style={{ background: 'transparent', color: darkMode ? '#E6EDF3' : '#1A202C', border: `1.5px solid ${darkMode ? '#30363D' : '#E2E8F0'}` }} onClick={handleImportExcel}><Upload size={15} />Exporter</button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Erreur API */}
        {apiError && !isLoading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: '#fff2f0', border: '1px solid #fecaca', borderRadius: 10,
            padding: '0.9rem 1.2rem', marginBottom: '1.5rem',
            color: '#b91c1c', fontSize: '0.88rem', fontWeight: 500,
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{apiError}</span>
            <button onClick={handleRefresh} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#ef4444', color: 'white', border: 'none',
              borderRadius: 7, padding: '0.4rem 0.85rem', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
            }}>
              <RefreshCw size={14} /> Réessayer
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="dashboard-loading">
            <Loader size={36} className="spinner-icon" />
            <p>Chargement des données…</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* KPI — 4 colonnes */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {statCards.map((stat, i) => (
                <div key={i} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties}>
                  <div className="stat-icon" style={{ backgroundColor: stat.color + '18', color: stat.color }}>
                    <stat.icon size={20} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{stat.value.toLocaleString()}</h3>
                    <p className="stat-description" style={{ color: stat.color === '#E74C3C' && (stat.value as number) > 0 ? '#E74C3C' : undefined }}>{stat.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts — layout : [bar opérateur | donut statut] + [line pleine largeur] */}
            <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>

              {/* 1 — Employés par Projet/Zone (Bar vertical) */}
              <div className="chart-card">
                <h3>Employés par projet</h3>
                {employeesByProject.length > 0 ? (() => {
                  const top5 = employeesByProject.slice(0, 5);
                  return (
                    <div style={{ position: 'relative', height: 240 }}>
                      <Bar
                        data={{
                          labels: top5.map(p => p.project_name.length > 16 ? p.project_name.slice(0, 16) + '…' : p.project_name),
                          datasets: [{ label: 'Employés', data: top5.map(p => p.count), backgroundColor: '#3498DB', borderRadius: 6, borderSkipped: false }],
                        }}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} employés` } } },
                          scales: {
                            x: { grid: { display: false }, ticks: { color: tk, font: { size: 11 } } },
                            y: { grid: { color: gr }, ticks: { color: tk }, beginAtZero: true },
                          },
                        }}
                      />
                    </div>
                  );
                })() : emptyChart('projets')}
              </div>

              {/* 2 — Statut des Contrats (Donut) */}
              <div className="chart-card">
                <h3>Statut des contrats</h3>
                {contractStatus && (contractStatus.active + contractStatus.completed + contractStatus.upcoming) > 0 ? (() => {
                  const csTotal = contractStatus.active + contractStatus.completed + contractStatus.upcoming;
                  const pctActif = Math.round((contractStatus.active / csTotal) * 100);
                  const csItems = [
                    { label: 'Actifs',  value: contractStatus.active,    color: '#27AE60' },
                    { label: 'Expirés', value: contractStatus.completed, color: '#E74C3C' },
                    { label: 'À venir', value: contractStatus.upcoming,  color: '#F39C12' },
                  ];
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ position: 'relative', height: 180, width: 180 }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 1 }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: darkMode ? '#E6EDF3' : '#1A202C', lineHeight: 1 }}>{pctActif}%</div>
                          <div style={{ fontSize: '0.65rem', color: tk, marginTop: 2 }}>Actifs</div>
                        </div>
                        <Doughnut
                          data={{ labels: ['Actifs', 'Expirés', 'À venir'], datasets: [{ data: [contractStatus.active, contractStatus.completed, contractStatus.upcoming], backgroundColor: ['#27AE60', '#E74C3C', '#F39C12'], borderColor: darkMode ? '#161B22' : '#ffffff', borderWidth: 3, hoverOffset: 8 }] }}
                          options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}` } } } }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: 200 }}>
                        {csItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 13 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                            <span style={{ color: tk, flex: 1 }}>{item.label}</span>
                            <span style={{ fontWeight: 600, color: darkMode ? '#E6EDF3' : '#1A202C' }}>{Math.round((item.value / csTotal) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })() : emptyChart('contrats')}
              </div>

              {/* 3 — Évolution des recrutements (Line pleine largeur) */}
              <div className="chart-card chart-card-wide">
                <h3>Évolution des recrutements (12 mois)</h3>
                {monthlyHires.length > 0 ? (
                  <div style={{ position: 'relative', height: 200 }}>
                    <Line
                      data={{
                        labels: monthlyHires.map(h => {
                          const d = new Date(h.month + '-01');
                          return d.toLocaleDateString('fr-FR', { month: 'short' });
                        }),
                        datasets: [{
                          label: 'Recrutements',
                          data: monthlyHires.map(h => h.count),
                          borderColor: '#3498DB',
                          backgroundColor: darkMode ? 'rgba(52,152,219,0.12)' : 'rgba(52,152,219,0.15)',
                          fill: true, tension: 0.4,
                          pointRadius: 3, pointHoverRadius: 7,
                          pointBackgroundColor: '#3498DB',
                          pointBorderColor: darkMode ? '#161B22' : '#ffffff',
                          pointBorderWidth: 2,
                        }],
                      }}
                      options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} recrutements` } } },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: tk } },
                          y: { grid: { color: gr }, ticks: { color: tk }, beginAtZero: true },
                        },
                      }}
                    />
                  </div>
                ) : emptyChart('recrutements')}
              </div>

              {/* 4 — Top 5 Postes */}
              <div className="chart-card">
                <h3>Top 5 Postes</h3>
                {employeesByPosition.length > 0 ? (() => {
                  const top5 = employeesByPosition.slice(0, 5);
                  return (
                    <div style={{ position: 'relative', height: 210 }}>
                      <Bar
                        data={{
                          labels: top5.map(p => p.position.length > 22 ? p.position.slice(0, 22) + '…' : p.position),
                          datasets: [{ label: 'Employés', data: top5.map(p => p.count), backgroundColor: C.slice(0, top5.length), borderRadius: 6, borderSkipped: false }],
                        }}
                        options={{
                          indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
                          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} employés` } } },
                          scales: { x: { grid: { color: gr }, ticks: { color: tk } }, y: { grid: { display: false }, ticks: { color: tk, font: { size: 11 } } } },
                        }}
                      />
                    </div>
                  );
                })() : emptyChart('postes')}
              </div>

              {/* 5 — Employés par Zone */}
              <div className="chart-card">
                <h3>Employés par Zone (Top 5)</h3>
                {employeesByZone.length > 0 ? (() => {
                  // Si l'API renvoie des départements → afficher par département·région
                  // Sinon (données manquantes) → agréger par région
                  const hasDept = employeesByZone.some(z => z.departement && z.departement.trim());

                  type Row = { label: string; sublabel: string; count: number };
                  let rows: Row[];

                  if (hasDept) {
                    rows = [...employeesByZone]
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                      .map(z => ({
                        label:    z.departement.trim(),
                        sublabel: z.region,
                        count:    z.count,
                      }));
                  } else {
                    rows = Object.values(
                      employeesByZone.reduce((acc, z) => {
                        const k = z.region || 'Inconnu';
                        if (!acc[k]) acc[k] = { label: k, sublabel: '', count: 0 };
                        acc[k].count += z.count;
                        return acc;
                      }, {} as Record<string, Row>)
                    ).sort((a, b) => b.count - a.count).slice(0, 5);
                  }

                  const truncate = (s: string, n = 22) => s.length > n ? s.slice(0, n) + '…' : s;

                  return (
                    <div style={{ position: 'relative', height: Math.max(180, rows.length * 44) }}>
                      <Bar
                        data={{
                          labels: rows.map(r => truncate(hasDept ? `${r.label} · ${r.sublabel}` : r.label)),
                          datasets: [{
                            label: 'Employés',
                            data: rows.map(r => r.count),
                            backgroundColor: C.slice(0, rows.length),
                            borderRadius: 6,
                            borderSkipped: false,
                          }],
                        }}
                        options={{
                          indexAxis: 'y' as const,
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (c) => {
                              const r = rows[c.dataIndex];
                              return r.sublabel
                                ? ` ${c.parsed.x} employés — ${r.label}, ${r.sublabel}`
                                : ` ${c.parsed.x} employés`;
                            }}},
                          },
                          scales: {
                            x: { grid: { color: gr }, ticks: { color: tk } },
                            y: { grid: { display: false }, ticks: { color: tk, font: { size: 11 } } },
                          },
                        }}
                      />
                    </div>
                  );
                })() : emptyChart('zones')}
              </div>

            </div>
          </>
        )}
      </div>

      {/* Modal import */}
      {showImportModal && (
        <div className="import-modal-overlay">
          <div className="import-modal">
            <div className="import-modal-header">
              <h2>Progression de l'import</h2>
              <button className="import-modal-close" onClick={() => {
                setShowImportModal(false);
                setNotificationMessage(`${importProgress?.success || 0}/${importProgress?.total || 0} employés importés`);
              }}><X size={24} /></button>
            </div>
            <div className="import-modal-content">
              {isImporting ? (
                <div className="import-loading"><div className="spinner"></div><p>Importation en cours…</p></div>
              ) : importProgress ? (
                <>
                  <div className="import-stats">
                    <div className="stat"><span className="label">Total:</span><span className="value">{importProgress.total}</span></div>
                    <div className="stat success"><span className="label">Succès:</span><span className="value">{importProgress.success}</span></div>
                    <div className="stat error"><span className="label">Erreurs:</span><span className="value">{importProgress.errors.length}</span></div>
                  </div>
                  <div className="import-progress-bar">
                    <div className="progress-fill" style={{ width: `${(importProgress.success / importProgress.total) * 100}%` }}></div>
                  </div>
                  {importProgress.success > 0 && (
                    <div className="import-employees-list">
                      <h3>Employés importés ({importProgress.employees.length})</h3>
                      <div className="employees-scroll">
                        {importProgress.employees.slice(0, 10).map((emp, idx) => (
                          <div key={idx} className="employee-item">
                            <CheckCircle size={16} style={{ color: '#27AE60' }} />
                            <span>{emp.prenom} {emp.nom} — {emp.poste}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {importProgress.errors.length > 0 && (
                    <div className="import-errors-list">
                      <h3>Erreurs ({importProgress.errors.length})</h3>
                      <div className="errors-scroll">
                        {importProgress.errors.slice(0, 5).map((err, idx) => (
                          <div key={idx} className="error-item">
                            <AlertCircle size={16} style={{ color: '#E74C3C' }} />
                            <span>Ligne {err.row}: {err.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {notificationMessage && (
        <div className="notification-bar">
          <div className="notification-content">
            <CheckCircle size={20} style={{ color: '#27AE60' }} />
            <span>{notificationMessage}</span>
          </div>
          <button className="notification-close" onClick={() => setNotificationMessage('')}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
