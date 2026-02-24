import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Briefcase, Settings, Upload, Users, TrendingUp, Download, X, CheckCircle, Clock, AlertCircle, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AforDashboard.css';

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

export default function AforDashboard() {
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

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchDashboardData = useCallback(async (filter: string = 'all') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      // Récupérer l'acteur_id de l'utilisateur connecté
      const acteurId = sessionStorage.getItem('acteur_id');
      
      // Pour AFOR, on utilise les endpoints opérateur avec l'acteur_id de l'utilisateur
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
      
      if (statsRes.ok) setStats(await statsRes.json());
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
    
    fetchDashboardData(filterType);
  }, [filterType]);

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

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setShowImportModal(true);
      setIsImporting(true);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        
        const response = await fetch(
          `${apiUrl}/import-export/import-employees?acteur_id=afor&projet_id=default`,
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
        
        setTimeout(() => {
          fetchDashboardData(filterType);
        }, 1000);
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
    <div className={`afor-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <div className="afor-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/afor-logo.jpeg" alt="AFOR" className="logo-img" />
          </div>
          <h2>AFOR</h2>
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
          <a href="/afor/settings" className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`} onClick={() => setActiveNav('settings')}>
            <Settings size={20} />
            <span>Paramètres</span>
          </a>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>

      <div className="afor-main">
        <div className="afor-header">
          <div className="header-content">
            <h1>Tableau de bord AFOR</h1>
            <p>Bienvenue sur votre espace AFOR</p>
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
          <div className="chart-card">
            <h3>Statut des Contrats</h3>
            <div className="status-grid">
              <div className="status-item">
                <div className="status-label">Actifs</div>
                <div className="status-value" style={{ color: '#27AE60' }}>{contractStatus?.active || 0}</div>
              </div>
              <div className="status-item">
                <div className="status-label">Terminés</div>
                <div className="status-value" style={{ color: '#3498DB' }}>{contractStatus?.completed || 0}</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Répartition par Projet</h3>
            <div className="positions-list">
              {employeesByProject.slice(0, 5).map((proj, index) => (
                <div key={index} className="position-item">
                  <div className="position-name">{proj.project_name}</div>
                  <div className="position-bar">
                    <div className="position-progress" style={{ width: `${(proj.count / Math.max(...employeesByProject.map(p => p.count), 1)) * 100}%` }}></div>
                  </div>
                  <div className="position-count">{proj.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Répartition par Genre</h3>
            <div className="positions-list">
              {employeesByGender.map((gender, index) => {
                const genderLabel = gender.gender === 'M' ? 'Homme' : gender.gender === 'F' ? 'Femme' : gender.gender;
                return (
                  <div key={index} className="position-item">
                    <div className="position-name">{genderLabel}</div>
                    <div className="position-bar">
                      <div className="position-progress" style={{ width: `${gender.percentage}%` }}></div>
                    </div>
                    <div className="position-count">{gender.count} ({gender.percentage}%)</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="chart-card">
            <h3>Statistiques d'Âge</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Âge Moyen:</span>
                <span className="info-value">{ageStats?.average_age || 0} ans</span>
              </div>
              <div className="info-item">
                <span className="info-label">Âge Min:</span>
                <span className="info-value">{ageStats?.min_age || 0} ans</span>
              </div>
              <div className="info-item">
                <span className="info-label">Âge Max:</span>
                <span className="info-value">{ageStats?.max_age || 0} ans</span>
              </div>
              <div className="info-item">
                <span className="info-label">Groupe 18-25:</span>
                <span className="info-value">{ageStats?.age_groups?.["18-25"] || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Groupe 26-35:</span>
                <span className="info-value">{ageStats?.age_groups?.["26-35"] || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Groupe 36-45:</span>
                <span className="info-value">{ageStats?.age_groups?.["36-45"] || 0}</span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Top 5 Postes</h3>
            <div className="positions-list">
              {employeesByPosition.slice(0, 5).map((pos, index) => (
                <div key={index} className="position-item">
                  <div className="position-name">{pos.position}</div>
                  <div className="position-bar">
                    <div className="position-progress" style={{ width: `${(pos.count / Math.max(...employeesByPosition.map(p => p.count), 1)) * 100}%` }}></div>
                  </div>
                  <div className="position-count">{pos.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Employés par Zone</h3>
            <div className="zones-list">
              {employeesByZone.slice(0, 5).map((zone, index) => (
                <div key={index} className="zone-item">
                  <div className="zone-info">
                    <p className="zone-name">{zone.region} - {zone.departement}</p>
                    <p className="zone-count">{zone.count} employé(s)</p>
                  </div>
                  <div className="zone-bar">
                    <div className="zone-progress" style={{ width: `${(zone.count / Math.max(...employeesByZone.map(z => z.count), 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Informations Clés</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Total Contrats:</span>
                <span className="info-value">{avgContractDuration?.total_contracts || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Durée Moyenne:</span>
                <span className="info-value">{avgContractDuration?.average_months || 0} mois</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dernière Connexion:</span>
                <span className="info-value">
                  {stats?.last_login ? new Date(stats.last_login).toLocaleDateString('fr-FR') : 'N/A'}
                </span>
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

          <div className="chart-card">
            <h3>Répartition par Type de Contrat</h3>
            <div className="positions-list">
              {contractTypes.slice(0, 5).map((type, index) => (
                <div key={index} className="position-item">
                  <div className="position-name">{type.type}</div>
                  <div className="position-bar">
                    <div className="position-progress" style={{ width: `${type.percentage}%` }}></div>
                  </div>
                  <div className="position-count">{type.count} ({type.percentage}%)</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Niveau d'Éducation</h3>
            <div className="positions-list">
              {educationLevels.slice(0, 5).map((edu, index) => (
                <div key={index} className="position-item">
                  <div className="position-name">{edu.level}</div>
                  <div className="position-bar">
                    <div className="position-progress" style={{ width: `${edu.percentage}%` }}></div>
                  </div>
                  <div className="position-count">{edu.count} ({edu.percentage}%)</div>
                </div>
              ))}
            </div>
          </div>

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
                <span className="info-label">Total:</span>
                <span className="info-value">{renewalRate?.total || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Taux de Renouvellement:</span>
                <span className="info-value" style={{ color: '#F39C12', fontSize: '18px', fontWeight: 'bold' }}>
                  {renewalRate?.renewal_rate || 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3>Top 5 Écoles/Formations</h3>
            <div className="positions-list">
              {topSchools.map((school, index) => (
                <div key={index} className="position-item">
                  <div className="position-name">{school.school}</div>
                  <div className="position-bar">
                    <div className="position-progress" style={{ width: `${(school.count / Math.max(...topSchools.map(s => s.count), 1)) * 100}%` }}></div>
                  </div>
                  <div className="position-count">{school.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Embauches par Mois (12 derniers mois)</h3>
            <div className="positions-list">
              {monthlyHires.slice(-6).map((hire, index) => (
                <div key={index} className="position-item">
                  <div className="position-name">{hire.month}</div>
                  <div className="position-bar">
                    <div className="position-progress" style={{ width: `${(hire.count / Math.max(...monthlyHires.map(h => h.count), 1)) * 100}%` }}></div>
                  </div>
                  <div className="position-count">{hire.count}</div>
                </div>
              ))}
            </div>
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
