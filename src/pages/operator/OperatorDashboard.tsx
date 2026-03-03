import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList, CheckCircle, Clock, AlertCircle, Settings, Briefcase, Upload, Users, TrendingUp, Download, X } from 'lucide-react';
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

interface EmployeesByPosition {
  position: string;
  count: number;
}

interface EmployeesByZone {
  zone_id: string;
  region: string;
  departement: string;
  count: number;
}

interface ContractStatus {
  active: number;
  completed: number;
  upcoming: number;
}

interface AverageContractDuration {
  average_days: number;
  average_months: number;
  total_contracts: number;
}

interface EmployeesByProject {
  project_id: string;
  project_name: string;
  count: number;
}

interface EmployeesByGender {
  gender: string;
  count: number;
  percentage: number;
}

interface AgeStatistics {
  average_age: number;
  min_age: number;
  max_age: number;
  age_groups: { [key: string]: number };
}

interface ContractType {
  type: string;
  count: number;
  percentage: number;
}

interface EducationLevel {
  level: string;
  count: number;
  percentage: number;
}

interface ContractRenewalRate {
  active: number;
  expired: number;
  total: number;
  renewal_rate: number;
}

interface TopSchool {
  school: string;
  count: number;
}

interface MonthlyHire {
  month: string;
  count: number;
}

interface ImportProgress {
  total: number;
  success: number;
  errors: Array<{ row: number; error: string }>;
  employees: Array<{ nom: string; prenom: string; poste: string }>;
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [filterType, setFilterType] = useState<'all' | 'active'>('all');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employeesByPosition, setEmployeesByPosition] = useState<EmployeesByPosition[]>([]);
  const [employeesByZone, setEmployeesByZone] = useState<EmployeesByZone[]>([]);
  const [employeesByProject, setEmployeesByProject] = useState<EmployeesByProject[]>([]);
  const [employeesByGender, setEmployeesByGender] = useState<EmployeesByGender[]>([]);
  const [ageStats, setAgeStats] = useState<AgeStatistics | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [avgContractDuration, setAvgContractDuration] = useState<AverageContractDuration | null>(null);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [renewalRate, setRenewalRate] = useState<ContractRenewalRate | null>(null);
  const [topSchools, setTopSchools] = useState<TopSchool[]>([]);
  const [monthlyHires, setMonthlyHires] = useState<MonthlyHire[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');

  const fetchDashboardData = useCallback(async (acteurId: string, filter: string = 'all') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      console.log('Fetching dashboard data for acteur_id:', acteurId, 'filter:', filter);
      
      const [statsRes, posRes, zoneRes, contractRes, avgRes, projRes, genderRes, ageRes, typesRes, educRes, renewalRes, schoolsRes, hiresRes] = await Promise.all([
        fetch(`${apiUrl}/dashboard/operator/stats/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-position/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-zone/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/contract-status/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/average-contract-duration/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-project/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/employees-by-gender/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/age-statistics/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/contract-types/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/education-level/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/contract-renewal-rate/${acteurId}`),
        fetch(`${apiUrl}/dashboard/operator/top-schools/${acteurId}?filter_type=${filter}`),
        fetch(`${apiUrl}/dashboard/operator/monthly-hires/${acteurId}?months=12`)
      ]);
      
      console.log('Stats response:', statsRes.status);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Stats data:', statsData);
        setStats(statsData);
      }
      if (posRes.ok) setEmployeesByPosition(await posRes.json());
      if (zoneRes.ok) setEmployeesByZone(await zoneRes.json());
      if (contractRes.ok) setContractStatus(await contractRes.json());
      if (avgRes.ok) setAvgContractDuration(await avgRes.json());
      if (projRes.ok) setEmployeesByProject(await projRes.json());
      if (genderRes.ok) setEmployeesByGender(await genderRes.json());
      if (ageRes.ok) setAgeStats(await ageRes.json());
      if (typesRes.ok) setContractTypes(await typesRes.json());
      if (educRes.ok) setEducationLevels(await educRes.json());
      if (renewalRes.ok) setRenewalRate(await renewalRes.json());
      if (schoolsRes.ok) setTopSchools(await schoolsRes.json());
      if (hiresRes.ok) setMonthlyHires(await hiresRes.json());
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const acteurId = sessionStorage.getItem('acteur_id');
    if (!acteurId) {
      navigate('/login');
      return;
    }
    
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    fetchDashboardData(acteurId, filterType);
  }, [navigate, fetchDashboardData, filterType]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/import-export/download-template`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement du template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_employes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setNotificationMessage('Template téléchargé avec succès!');
      setTimeout(() => setNotificationMessage(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotificationMessage('Erreur lors du téléchargement du template');
      setTimeout(() => setNotificationMessage(''), 3000);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setShowImportModal(true);
      setIsImporting(true);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const acteurId = sessionStorage.getItem('acteur_id');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        
        const response = await fetch(
          `${apiUrl}/import-export/import-employees?acteur_id=${acteurId}&projet_id=default`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        if (!response.ok) {
          throw new Error('Erreur lors de l\'import');
        }
        
        const result = await response.json();
        setImportProgress(result);
        setNotificationMessage(`${result.success}/${result.total} employés importés avec succès`);
        
        // Recharger les données du dashboard
        if (acteurId) {
          setTimeout(() => {
            fetchDashboardData(acteurId, filterType);
          }, 1000);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setNotificationMessage('Erreur lors de l\'import du fichier');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const statCards = [
    { 
      label: 'Total Employés', 
      value: stats?.total_employees || 0, 
      icon: Users, 
      color: '#3498DB',
      description: 'Employés enregistrés'
    },
    { 
      label: 'Contrats Actifs', 
      value: stats?.active_contracts || 0, 
      icon: CheckCircle, 
      color: '#27AE60',
      description: 'Contrats en cours'
    },
    { 
      label: 'Employés > 25 ans', 
      value: stats?.young_employees_over_25 || 0, 
      icon: TrendingUp, 
      color: '#F39C12',
      description: 'Employés de plus de 25 ans'
    },
    { 
      label: 'Durée Moy. Contrat', 
      value: `${avgContractDuration?.average_months || 0}m`, 
      icon: Clock, 
      color: '#E74C3C',
      description: 'Durée moyenne en mois'
    },
  ];

  return (
    <div className={`operator-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <div className="operator-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/afor-logo.jpeg" alt="AFOR" className="logo-img" />
          </div>
          <h2>Opérateur</h2>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveNav('dashboard')}>
            <ClipboardList size={20} />
            <span>Tableau de bord</span>
          </a>
          <a href="/employees" className={`nav-item ${activeNav === 'jobs' ? 'active' : ''}`} onClick={() => setActiveNav('jobs')}>
            <Briefcase size={20} />
            <span>Emploi</span>
          </a>
          <a href="#supervision" className={`nav-item ${activeNav === 'supervision' ? 'active' : ''}`} onClick={() => setActiveNav('supervision')}>
            <Users size={20} />
            <span>Superviseur</span>
          </a>
          <a href="/operator/settings" className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
            <Settings size={20} />
            <span>Paramètres</span>
          </a>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>

      <div className="operator-main">
        <div className="operator-header">
          <div className="header-content">
            <h1>Tableau de bord Opérateur</h1>
            <p>Bienvenue sur votre espace opérateur</p>
          </div>
          <div className="header-buttons">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as 'all' | 'active')}
              className="filter-select"
            >
              <option value="all">Tous les employés</option>
              <option value="active">Employés actifs</option>
            </select>
            <button className="btn-primary" onClick={handleDownloadTemplate}>
              <Download size={20} />
              Télécharger Template
            </button>
            <button className="btn-primary" onClick={handleImportExcel}>
              <Upload size={20} />
              Importer Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-description">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="charts-grid">
          {/* Statut des contrats – PieChart */}
          <div className="chart-card">
            <h3>Statut des Contrats</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Actifs', value: contractStatus?.active || 0 },
                    { name: 'Terminés', value: contractStatus?.completed || 0 },
                  ]}
                  cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                >
                  <Cell fill="#27AE60" />
                  <Cell fill="#3498DB" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par Genre – PieChart */}
          <div className="chart-card">
            <h3>Répartition par Genre</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={employeesByGender.map(g => ({
                    name: g.gender === 'M' ? 'Hommes' : g.gender === 'F' ? 'Femmes' : g.gender,
                    value: g.count,
                  }))}
                  cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                >
                  {employeesByGender.map((_, i) => <Cell key={i} fill={OP_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Postes – BarChart */}
          <div className="chart-card">
            <h3>Top 5 Postes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={employeesByPosition.slice(0, 5)} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="position" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="count" fill="#FF8C00" radius={[4, 4, 0, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Types de contrats – BarChart */}
          <div className="chart-card">
            <h3>Types de Contrats</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contractTypes.slice(0, 5)} margin={{ top: 5, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Contrats']} />
                <Bar dataKey="count" fill="#3498DB" radius={[4, 4, 0, 0]} name="Contrats" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Niveau d'éducation – BarChart horizontal */}
          <div className="chart-card">
            <h3>Niveau d'Éducation</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={educationLevels.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 70, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="level" type="category" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="count" fill="#9B59B6" radius={[0, 4, 4, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Employés par Zone – BarChart */}
          <div className="chart-card">
            <h3>Employés par Zone (Top 5)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={employeesByZone.slice(0, 5).map(z => ({ zone: z.region.slice(0, 8), count: z.count }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="zone" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="count" fill="#27AE60" radius={[4, 4, 0, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Taux de renouvellement – info card */}
          <div className="chart-card">
            <h3>Taux de Renouvellement</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Contrats Actifs:</span>
                <span className="info-value" style={{ color: '#27AE60' }}>{renewalRate?.active || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contrats Expirés:</span>
                <span className="info-value" style={{ color: '#E74C3C' }}>{renewalRate?.expired || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Taux:</span>
                <span className="info-value" style={{ color: '#F39C12', fontSize: '22px', fontWeight: '700' }}>
                  {renewalRate?.renewal_rate || 0}%
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Durée Moy. Contrat:</span>
                <span className="info-value">{avgContractDuration?.average_months || 0} mois</span>
              </div>
              <div className="info-item">
                <span className="info-label">Taux d'Activité:</span>
                <span className="info-value">
                  {stats && stats.total_employees > 0
                    ? Math.round((stats.active_contracts / stats.total_employees) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Top Écoles – BarChart */}
          <div className="chart-card">
            <h3>Top 5 Écoles / Formations</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topSchools.slice(0, 5).map(s => ({ school: s.school.slice(0, 12), count: s.count }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="school" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Diplômés']} />
                <Bar dataKey="count" fill="#F39C12" radius={[4, 4, 0, 0]} name="Diplômés" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Embauches par mois – BarChart wide */}
          <div className="chart-card chart-card-wide">
            <h3>Embauches par Mois (12 derniers mois)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyHires} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Embauches']} />
                <Bar dataKey="count" fill="#1ABC9C" radius={[4, 4, 0, 0]} name="Embauches" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Groupes d'âge – BarChart */}
          <div className="chart-card">
            <h3>Groupes d'Âge</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={[
                  { tranche: '18-25', count: ageStats?.age_groups?.['18-25'] || 0 },
                  { tranche: '26-35', count: ageStats?.age_groups?.['26-35'] || 0 },
                  { tranche: '36-45', count: ageStats?.age_groups?.['36-45'] || 0 },
                  { tranche: '46-55', count: ageStats?.age_groups?.['46-55'] || 0 },
                  { tranche: '56+',   count: ageStats?.age_groups?.['56+']   || 0 },
                ]}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="tranche" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="count" fill="#E74C3C" radius={[4, 4, 0, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
            <div className="age-summary">
              <span>Moy: <strong>{ageStats?.average_age || 0} ans</strong></span>
              <span>Min: <strong>{ageStats?.min_age || 0}</strong></span>
              <span>Max: <strong>{ageStats?.max_age || 0}</strong></span>
            </div>
          </div>

          {/* Répartition par Projet – BarChart */}
          <div className="chart-card">
            <h3>Répartition par Projet</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={employeesByProject.slice(0, 5).map(p => ({ name: p.project_name.slice(0, 12), count: p.count }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="count" fill="#FF8C00" radius={[4, 4, 0, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal de progression d'import */}
      {showImportModal && (
        <div className="import-modal-overlay">
          <div className="import-modal">
            <div className="import-modal-header">
              <h2>Progression de l'import</h2>
              <button 
                className="import-modal-close"
                onClick={() => {
                  setShowImportModal(false);
                  setNotificationMessage(`${importProgress?.success || 0}/${importProgress?.total || 0} employés importés`);
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="import-modal-content">
              {isImporting ? (
                <div className="import-loading">
                  <div className="spinner"></div>
                  <p>Importation en cours...</p>
                </div>
              ) : importProgress ? (
                <>
                  <div className="import-stats">
                    <div className="stat">
                      <span className="label">Total:</span>
                      <span className="value">{importProgress.total}</span>
                    </div>
                    <div className="stat success">
                      <span className="label">Succès:</span>
                      <span className="value">{importProgress.success}</span>
                    </div>
                    <div className="stat error">
                      <span className="label">Erreurs:</span>
                      <span className="value">{importProgress.errors.length}</span>
                    </div>
                  </div>

                  <div className="import-progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(importProgress.success / importProgress.total) * 100}%` }}
                    ></div>
                  </div>

                  {importProgress.success > 0 && (
                    <div className="import-employees-list">
                      <h3>Employés importés ({importProgress.employees.length})</h3>
                      <div className="employees-scroll">
                        {importProgress.employees.slice(0, 10).map((emp, idx) => (
                          <div key={idx} className="employee-item">
                            <CheckCircle size={16} style={{ color: '#27AE60' }} />
                            <span>{emp.prenom} {emp.nom} - {emp.poste}</span>
                          </div>
                        ))}
                        {importProgress.employees.length > 10 && (
                          <div className="employee-item">
                            <span>... et {importProgress.employees.length - 10} autres</span>
                          </div>
                        )}
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
                        {importProgress.errors.length > 5 && (
                          <div className="error-item">
                            <span>... et {importProgress.errors.length - 5} autres erreurs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Barre de notification */}
      {notificationMessage && (
        <div className="notification-bar">
          <div className="notification-content">
            <CheckCircle size={20} style={{ color: '#27AE60' }} />
            <span>{notificationMessage}</span>
          </div>
          <button 
            className="notification-close"
            onClick={() => setNotificationMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
