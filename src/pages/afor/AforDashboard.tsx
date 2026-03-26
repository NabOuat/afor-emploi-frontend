import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Users, TrendingUp, Download, X, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import ZoomPlugin from 'chartjs-plugin-zoom';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import '../../styles/AforDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler, ZoomPlugin);

// ── Cache sessionStorage 5 minutes ─────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000;
function getCache(acteurId: string, filter: string) {
  try {
    const raw = sessionStorage.getItem(`afor_dash_${acteurId}_${filter}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? data : null;
  } catch { return null; }
}
function setCache(acteurId: string, filter: string, data: unknown) {
  try {
    sessionStorage.setItem(`afor_dash_${acteurId}_${filter}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}
function clearDashCache(acteurId: string) {
  ['all', 'active'].forEach(f => sessionStorage.removeItem(`afor_dash_${acteurId}_${f}`));
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

export default function AforDashboard() {
  const navigate = useNavigate();
  const { logout: _logout } = useAuth();
  const [darkMode,          setDarkMode]          = useState(false);
  const [filterType,        setFilterType]         = useState<'all' | 'active'>('all');
  const [isLoading,         setIsLoading]          = useState(true);
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

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
  }, []);

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

  const fetchDashboardData = useCallback(async (filter: string = 'all') => {
    const acteurId = sessionStorage.getItem('acteur_id');
    if (!acteurId) return;

    const cached = getCache(acteurId, filter);
    if (cached) { applyData(cached); setIsLoading(false); return; }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const url = `${apiUrl}/dashboard/operator/all/${acteurId}?filter_type=${filter}`;
      console.log('[AFOR fetch] → envoi requête:', url);

      // ── Essai endpoint combiné (optimisé) ──────────────────────────────
      const res = await fetch(url);
      console.log('[AFOR fetch] ← statut HTTP:', res.status, res.ok ? 'OK' : 'ERREUR');
      if (res.ok) {
        const data = await res.json();
        console.log('[AFOR fetch] ← données reçues (clés):', Object.keys(data));
        setCache(acteurId, filter, data);
        applyData(data);
        return;
      }

      // ── Fallback : 9 endpoints parallèles (ancien comportement) ────────
      const [sR, pR, zR, cR, aR, prR, gR, agR, hR] = await Promise.all([
        fetch(`${apiUrl}/dashboard/operator/stats/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-position/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-zone/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/contract-status/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/average-contract-duration/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-project/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-gender/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/age-statistics/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/monthly-hires/${acteurId}?months=12`),
      ]);
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
    } catch (error) {
      console.error('[AFOR fetch] EXCEPTION:', error);
    } finally {
      setIsLoading(false);
    }
  }, [applyData]);

  useEffect(() => {
    const token    = sessionStorage.getItem('token');
    const acteurId = sessionStorage.getItem('acteur_id');
    if (!token || !acteurId) { navigate('/login'); return; }
    const saved = localStorage.getItem('darkMode') === 'true';
    setDarkMode(saved);
    if (saved) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    fetchDashboardData(filterType);
  }, [filterType, fetchDashboardData, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);


  const handleDownloadTemplate = async () => {
    try {
      const apiUrl   = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/import-export/download-template`);
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
        method: 'POST', body: formData,
      });
      if (!response.ok) throw new Error('Erreur import');
      const result = await response.json();
      setImportProgress(result);
      setNotificationMessage(`${result.success}/${result.total} employés importés avec succès`);
      if (acteurId) {
        clearDashCache(acteurId);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        fetch(`${apiUrl}/dashboard/operator/cache/${acteurId}`, { method: 'DELETE' }).catch(() => {});
      }
      setTimeout(() => fetchDashboardData(filterType), 1000);
    } catch {
      setNotificationMessage('Erreur lors de l\'import du fichier');
    } finally {
      setIsImporting(false);
    }
  };

  // Couleurs Chart.js adaptées au dark mode
  const tk = darkMode ? '#8a98b0' : '#6b7a90';  // texte axes
  const gr = darkMode ? '#2a3448' : '#e8edf3';  // grille

  const statCards = [
    { label: 'Total Employés',      value: stats?.total_employees || 0,         icon: Users,       color: '#3498DB', description: 'Employés enregistrés' },
    { label: 'Contrats Actifs',     value: stats?.active_contracts || 0,        icon: CheckCircle, color: '#27AE60', description: 'Contrats en cours' },
    { label: 'Employés > 25 ans',   value: stats?.young_employees_over_25 || 0, icon: TrendingUp,  color: '#F39C12', description: 'Plus de 25 ans' },
  ];

  const emptyChart = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#8a98b0', fontSize: '0.82rem' }}>
      Aucune donnée — {label}
    </div>
  );

  return (
    <div className={`afor-dashboard${darkMode ? ' dark-mode' : ''}`}>
      <div className="afor-main">

        {/* Header */}
        <div className="afor-header">
          <div className="header-content">
            <h1>Tableau de bord AFOR</h1>
            <p>Suivi des employés et contrats</p>
          </div>
          <div className="header-buttons">
            <select value={filterType} onChange={e => setFilterType(e.target.value as 'all' | 'active')} className="filter-select">
              <option value="all">Tous les employés</option>
              <option value="active">Employés actifs</option>
            </select>
            <button className="btn-primary" onClick={handleDownloadTemplate}><Download size={18} />Template</button>
            <button className="btn-primary" onClick={handleImportExcel}><Upload size={18} />Importer</button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="dashboard-loading">
            <Loader size={36} className="spinner-icon" />
            <p>Chargement des données…</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* KPI cards */}
            <div className="stats-grid">
              {statCards.map((stat, i) => (
                <div key={i} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties}>
                  <div className="stat-icon" style={{ backgroundColor: stat.color + '18', color: stat.color }}>
                    <stat.icon size={22} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{stat.value}</h3>
                    <p className="stat-description">{stat.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="charts-grid">

              {/* 1 — Statut des Contrats */}
              <div className="chart-card">
                <h3>Statut des Contrats</h3>
                {contractStatus && (contractStatus.active + contractStatus.completed) > 0 ? (() => {
                  const csTotal = contractStatus.active + contractStatus.completed;
                  const csItems = [
                    { label: 'Actifs', value: contractStatus.active, color: '#27AE60' },
                    { label: 'Terminés', value: contractStatus.completed, color: '#3498DB' },
                  ];
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 0' }}>
                      <div style={{ position: 'relative', height: 160, width: 160, flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -52%)', textAlign: 'center', pointerEvents: 'none', zIndex: 1 }}>
                          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: darkMode ? '#e8edf3' : '#1a2332', lineHeight: 1 }}>{csTotal}</div>
                          <div style={{ fontSize: '0.65rem', color: '#8a98b0', marginTop: 2 }}>Total</div>
                        </div>
                        <Doughnut
                          data={{ labels: ['Actifs', 'Terminés'], datasets: [{ data: [contractStatus.active, contractStatus.completed], backgroundColor: ['#27AE60', '#3498DB'], borderColor: darkMode ? '#1c2333' : '#ffffff', borderWidth: 3, hoverOffset: 12 }] }}
                          options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} contrats` } } } }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        {csItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '1.65rem', fontWeight: 700, color: darkMode ? '#e8edf3' : '#1a2332', lineHeight: 1 }}>{item.value}</div>
                              <div style={{ fontSize: '0.72rem', color: '#8a98b0', marginTop: 3 }}>{item.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })() : emptyChart('contrats')}
              </div>

              {/* 2 — Répartition par Genre */}
              <div className="chart-card">
                <h3>Répartition par Genre</h3>
                {employeesByGender.length > 0 ? (() => {
                  const gTotal = employeesByGender.reduce((s, g) => s + g.count, 0);
                  const gLabels = employeesByGender.map(g => g.gender === 'M' ? 'Hommes' : g.gender === 'F' ? 'Femmes' : g.gender);
                  const gColors = C.slice(0, employeesByGender.length);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 0' }}>
                      <div style={{ position: 'relative', height: 160, width: 160, flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -52%)', textAlign: 'center', pointerEvents: 'none', zIndex: 1 }}>
                          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: darkMode ? '#e8edf3' : '#1a2332', lineHeight: 1 }}>{gTotal}</div>
                          <div style={{ fontSize: '0.65rem', color: '#8a98b0', marginTop: 2 }}>Total</div>
                        </div>
                        <Doughnut
                          data={{ labels: gLabels, datasets: [{ data: employeesByGender.map(g => g.count), backgroundColor: gColors, borderColor: darkMode ? '#1c2333' : '#ffffff', borderWidth: 3, hoverOffset: 12 }] }}
                          options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed} (${Math.round((c.parsed / gTotal) * 100)}%)` } } } }}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                        {employeesByGender.map((g, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: gColors[i], flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '1.65rem', fontWeight: 700, color: darkMode ? '#e8edf3' : '#1a2332', lineHeight: 1 }}>{g.count}</div>
                              <div style={{ fontSize: '0.72rem', color: '#8a98b0', marginTop: 3 }}>{gLabels[i]} · {Math.round(g.percentage)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })() : emptyChart('genre')}
              </div>

              {/* 3 — Top 5 Postes */}
              <div className="chart-card">
                <h3>Top 5 Postes <span style={{ fontSize: '0.65rem', color: '#8a98b0', fontWeight: 400, textTransform: 'none' }}>— scroll pour zoomer · glisser pour déplacer</span></h3>
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
                          indexAxis: 'y' as const,
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} employés` } },
                            // @ts-expect-error zoom plugin
                            zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } },
                          },
                          scales: {
                            x: { grid: { color: gr }, ticks: { color: tk } },
                            y: { grid: { display: false }, ticks: { color: tk, font: { size: 11 } } },
                          },
                        }}
                      />
                    </div>
                  );
                })() : emptyChart('postes')}
              </div>

              {/* 4 — Répartition par Projet */}
              <div className="chart-card">
                <h3>Répartition par Projet <span style={{ fontSize: '0.65rem', color: '#8a98b0', fontWeight: 400, textTransform: 'none' }}>— scroll · glisser</span></h3>
                {employeesByProject.length > 0 ? (() => {
                  const top5 = employeesByProject.slice(0, 5);
                  return (
                    <div style={{ position: 'relative', height: 210 }}>
                      <Bar
                        data={{
                          labels: top5.map(p => p.project_name.length > 22 ? p.project_name.slice(0, 22) + '…' : p.project_name),
                          datasets: [{ label: 'Employés', data: top5.map(p => p.count), backgroundColor: C.slice(0, top5.length), borderRadius: 6, borderSkipped: false }],
                        }}
                        options={{
                          indexAxis: 'y' as const,
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} employés` } },
                            // @ts-expect-error zoom plugin
                            zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } },
                          },
                          scales: {
                            x: { grid: { color: gr }, ticks: { color: tk } },
                            y: { grid: { display: false }, ticks: { color: tk, font: { size: 11 } } },
                          },
                        }}
                      />
                    </div>
                  );
                })() : emptyChart('projets')}
              </div>

              {/* 5 — Employés par Zone */}
              <div className="chart-card">
                <h3>Employés par Zone (Top 5) <span style={{ fontSize: '0.65rem', color: '#8a98b0', fontWeight: 400, textTransform: 'none' }}>— scroll · glisser</span></h3>
                {employeesByZone.length > 0 ? (() => {
                  const top5 = employeesByZone.slice(0, 5);
                  return (
                    <div style={{ position: 'relative', height: 210 }}>
                      <Bar
                        data={{
                          labels: top5.map(z => z.region.length > 22 ? z.region.slice(0, 22) + '…' : z.region),
                          datasets: [{ label: 'Employés', data: top5.map(z => z.count), backgroundColor: C.slice(0, top5.length), borderRadius: 6, borderSkipped: false }],
                        }}
                        options={{
                          indexAxis: 'y' as const,
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (c) => ` ${c.parsed.x} employés` } },
                            // @ts-expect-error zoom plugin
                            zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } },
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

              {/* 6 — Groupes d'Âge */}
              <div className="chart-card">
                <h3>Groupes d'Âge <span style={{ fontSize: '0.65rem', color: '#8a98b0', fontWeight: 400, textTransform: 'none' }}>— scroll · glisser</span></h3>
                <div style={{ position: 'relative', height: 190 }}>
                  <Bar
                    data={{
                      labels: ['18-25', '26-35', '36-45', '46-55', '56+'],
                      datasets: [{
                        label: 'Employés',
                        data: [
                          ageStats?.age_groups?.['18-25'] || 0,
                          ageStats?.age_groups?.['26-35'] || 0,
                          ageStats?.age_groups?.['36-45'] || 0,
                          ageStats?.age_groups?.['46-55'] || 0,
                          ageStats?.age_groups?.['56+']   || 0,
                        ],
                        backgroundColor: ['#FF8C00', '#3498DB', '#27AE60', '#E74C3C', '#9B59B6'],
                        borderRadius: 6,
                        borderSkipped: false,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} employés` } },
                        // @ts-expect-error zoom plugin
                        zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } },
                      },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: tk } },
                        y: { grid: { color: gr }, ticks: { color: tk } },
                      },
                    }}
                  />
                </div>
                <div className="age-summary">
                  <span>Moy: <strong>{ageStats?.average_age || 0} ans</strong></span>
                  <span>Min: <strong>{ageStats?.min_age || 0}</strong></span>
                  <span>Max: <strong>{ageStats?.max_age || 0}</strong></span>
                </div>
              </div>

              {/* 7 — Embauches par Mois */}
              <div className="chart-card chart-card-wide">
                <h3>Embauches par Mois (12 derniers mois) <span style={{ fontSize: '0.65rem', color: '#8a98b0', fontWeight: 400, textTransform: 'none' }}>— scroll pour zoomer · glisser pour déplacer</span></h3>
                {monthlyHires.length > 0 ? (
                  <div style={{ position: 'relative', height: 230 }}>
                    <Line
                      data={{
                        labels: monthlyHires.map(h => (h.month || '').slice(0, 7)),
                        datasets: [{
                          label: 'Embauches',
                          data: monthlyHires.map(h => h.count),
                          borderColor: '#FF8C00',
                          backgroundColor: darkMode ? 'rgba(255,140,0,0.10)' : 'rgba(255,140,0,0.15)',
                          fill: true,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 9,
                          pointBackgroundColor: '#FF8C00',
                          pointBorderColor: darkMode ? '#1c2333' : '#ffffff',
                          pointBorderWidth: 2,
                        }],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} embauches` } },
                          // @ts-expect-error zoom plugin
                          zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' }, pan: { enabled: true, mode: 'xy' } },
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: tk } },
                          y: { grid: { color: gr }, ticks: { color: tk } },
                        },
                      }}
                    />
                  </div>
                ) : emptyChart('embauches')}
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
                        {importProgress.employees.length > 10 && <div className="employee-item"><span>… et {importProgress.employees.length - 10} autres</span></div>}
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
