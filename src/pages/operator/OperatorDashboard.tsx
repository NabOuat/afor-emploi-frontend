import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, Upload, Users, TrendingUp, Download, X, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import '../../styles/OperatorDashboard.css';

const OP_COLORS = ['#FF8C00', '#3498DB', '#27AE60', '#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C'];

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboardData = useCallback(async (acteurId: string, filter: string = 'all') => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

      const [statsRes, posRes, zoneRes, contractRes, avgRes, projRes, genderRes, ageRes, hiresRes] = await Promise.all([
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

      if (statsRes.ok) {
        const data = await statsRes.json();
        console.log('Stats:', data);
        setStats(data);
      }
      if (posRes.ok) {
        const data = await posRes.json();
        console.log('Employees by position:', data);
        setEmployeesByPosition(data);
      }
      if (zoneRes.ok) {
        const data = await zoneRes.json();
        console.log('Employees by zone:', data);
        setEmployeesByZone(data);
      }
      if (contractRes.ok) {
        const data = await contractRes.json();
        console.log('Contract status:', data);
        setContractStatus(data);
      }
      if (avgRes.ok) {
        const data = await avgRes.json();
        console.log('Avg contract duration:', data);
        setAvgContractDuration(data);
      }
      if (projRes.ok) {
        const data = await projRes.json();
        console.log('Employees by project:', data);
        setEmployeesByProject(data);
      }
      if (genderRes.ok) {
        const data = await genderRes.json();
        console.log('Employees by gender:', data);
        setEmployeesByGender(data);
      }
      if (ageRes.ok) {
        const data = await ageRes.json();
        console.log('Age stats:', data);
        setAgeStats(data);
      }
      if (hiresRes.ok) {
        const data = await hiresRes.json();
        console.log('Monthly hires:', data);
        setMonthlyHires(data);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    fetchDashboardData(acteurId, filterType);
  }, [navigate, fetchDashboardData, filterType]);

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
      if (acteurId) setTimeout(() => fetchDashboardData(acteurId, filterType), 1000);
    } catch {
      setNotificationMessage("Erreur lors de l'import du fichier");
    } finally {
      setIsImporting(false);
    }
  };

  const statCards = [
    { label: 'Total Employés',     value: stats?.total_employees || 0,                  icon: Users,       color: '#3498DB', description: 'Employés enregistrés' },
    { label: 'Contrats Actifs',    value: stats?.active_contracts || 0,                 icon: CheckCircle, color: '#27AE60', description: 'Contrats en cours' },
    { label: 'Employés > 25 ans',  value: stats?.young_employees_over_25 || 0,          icon: TrendingUp,  color: '#F39C12', description: 'Plus de 25 ans' },
    { label: 'Durée Moy. Contrat', value: `${avgContractDuration?.average_months || 0}m`, icon: Clock,     color: '#E74C3C', description: 'Durée moyenne' },
  ];

  const emptyChart = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#8a98b0', fontSize: '0.82rem' }}>
      Aucune donnée — {label}
    </div>
  );

  return (
    <div className={`operator-dashboard${darkMode ? ' dark-mode' : ''}`}>
      <div className="operator-main">

        {/* Header */}
        <div className="operator-header">
          <div className="header-content">
            <h1>Tableau de bord Opérateur</h1>
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

        {/* Loading */}
        {isLoading && (
          <div className="dashboard-loading">
            <Loader size={36} className="spinner-icon" />
            <p>Chargement des données…</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* KPI */}
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

              <div className="chart-card">
                <h3>Statut des Contrats</h3>
                <div style={{ width: '100%', height: 220 }}>
                  {contractStatus && (contractStatus.active + contractStatus.completed) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Actifs',   value: contractStatus.active },
                          { name: 'Terminés', value: contractStatus.completed },
                        ]} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                          <Cell fill="#27AE60" /><Cell fill="#3498DB" />
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : emptyChart('contrats')}
                </div>
              </div>

              <div className="chart-card">
                <h3>Répartition par Genre</h3>
                <div style={{ width: '100%', height: 220 }}>
                  {employeesByGender.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={employeesByGender.map(g => ({
                          name: g.gender === 'M' ? 'Hommes' : g.gender === 'F' ? 'Femmes' : g.gender,
                          value: g.count,
                        }))} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {employeesByGender.map((_, i) => <Cell key={i} fill={OP_COLORS[i]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : emptyChart('genre')}
                </div>
              </div>

              <div className="chart-card">
                <h3>Top 5 Postes</h3>
                <div style={{ width: '100%', height: 220 }}>
                  {employeesByPosition.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeesByPosition.slice(0, 5)} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="position" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v, 'Employés']} />
                        <Bar dataKey="count" fill="#FF8C00" radius={[4,4,0,0]} name="Employés" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : emptyChart('postes')}
                </div>
              </div>

              <div className="chart-card">
                <h3>Répartition par Projet</h3>
                <div style={{ width: '100%', height: 220 }}>
                  {employeesByProject.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeesByProject.slice(0,5).map(p => ({ name: p.project_name.slice(0,12), count: p.count }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v, 'Employés']} />
                        <Bar dataKey="count" fill="#FF8C00" radius={[4,4,0,0]} name="Employés" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : emptyChart('projets')}
                </div>
              </div>

              <div className="chart-card">
                <h3>Employés par Zone (Top 5)</h3>
                <div style={{ width: '100%', height: 220 }}>
                  {employeesByZone.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={employeesByZone.slice(0,5).map(z => ({ zone: z.region.slice(0,10), count: z.count }))}
                        margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="zone" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v, 'Employés']} />
                        <Bar dataKey="count" fill="#27AE60" radius={[4,4,0,0]} name="Employés" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : emptyChart('zones')}
                </div>
              </div>

              <div className="chart-card">
                <h3>Groupes d'Âge</h3>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { tranche: '18-25', count: ageStats?.age_groups?.['18-25'] || 0 },
                      { tranche: '26-35', count: ageStats?.age_groups?.['26-35'] || 0 },
                      { tranche: '36-45', count: ageStats?.age_groups?.['36-45'] || 0 },
                      { tranche: '46-55', count: ageStats?.age_groups?.['46-55'] || 0 },
                      { tranche: '56+',   count: ageStats?.age_groups?.['56+']   || 0 },
                    ]} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="tranche" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => [v, 'Employés']} />
                      <Bar dataKey="count" fill="#E74C3C" radius={[4,4,0,0]} name="Employés" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="age-summary">
                  <span>Moy: <strong>{ageStats?.average_age || 0} ans</strong></span>
                  <span>Min: <strong>{ageStats?.min_age || 0}</strong></span>
                  <span>Max: <strong>{ageStats?.max_age || 0}</strong></span>
                </div>
              </div>

              <div className="chart-card chart-card-wide">
                <h3>Embauches par Mois (12 derniers mois)</h3>
                <div style={{ width: '100%', height: 220 }}>
                  {monthlyHires.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyHires} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v, 'Embauches']} />
                        <Bar dataKey="count" fill="#1ABC9C" radius={[4,4,0,0]} name="Embauches" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : emptyChart('embauches')}
                </div>
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
