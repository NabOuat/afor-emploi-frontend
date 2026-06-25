import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { Search, Edit2, Plus, Users, CheckCircle, Download, ChevronLeft, ChevronRight, Eye, MapPin, RefreshCw, ArrowUp, ArrowDown, BarChart2, FileText, UserCheck, UserX, Layers, ChevronDown } from 'lucide-react';
import EmployeeModal from '../components/EmployeeModal';
import EditEmployeeModal from '../components/EditEmployeeModal';
import ChangeLocationModal from '../components/ChangeLocationModal';
import RenewContractModal from '../components/RenewContractModal';
import CreateEmployeeModal from '../components/CreateEmployeeModal';
import SkeletonLoader from '../components/SkeletonLoader';
import '../styles/EmployeesPage.css';
import { useDarkMode } from '../hooks/useDarkMode';

interface Projet {
  id: string;
  nom: string;
  nom_complet?: string;
  date_debut?: string;
  date_fin?: string;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  matricule?: string;
  qualification: string;
  poste: string;
  statut: 'Contractuel' | 'Fonctionnaire';
  genre: 'M' | 'F';
  age: number;
  date_naissance?: string;
  contact?: string;
  diplome?: string;
  ecole?: string;
  type_contrat?: string;
  date_debut?: string;
  date_fin?: string;
  categorie_poste?: string;
  validiteContrat: string;
  qualiteContrat: string;
  region: string;
  departement: string;
  sousPrefecture: string;
  projets: Projet[];
}

type SortField = keyof Employee | null;
type SortOrder = 'asc' | 'desc';

function transformEmployees(data: any[]): Employee[] {
  return data.map((emp) => {
    const statut: 'Contractuel' | 'Fonctionnaire' = emp.type_personne === 'Fonctionnaire' ? 'Fonctionnaire' : 'Contractuel';
    const genre: 'M' | 'F' = (emp.genre === 'M' || emp.genre === 'F') ? emp.genre : 'M';
    return {
      id: emp.id || '',
      nom: String(emp.nom || '').trim(),
      prenom: String(emp.prenom || '').trim(),
      matricule: emp.matricule && emp.matricule !== '-' ? emp.matricule : undefined,
      qualification: String(emp.qualification || 'Inconnu').trim(),
      poste: String(emp.poste || 'Non spécifié').trim(),
      statut,
      genre,
      age: Number(emp.age) || 0,
      date_naissance: emp.date_naissance || undefined,
      contact: emp.contact && emp.contact !== '-' ? emp.contact : undefined,
      diplome: emp.diplome && emp.diplome !== '-' ? emp.diplome : undefined,
      ecole: emp.ecole && emp.ecole !== '-' && typeof emp.ecole === 'string' ? emp.ecole : undefined,
      type_contrat: emp.type_contrat && emp.type_contrat !== '-' ? emp.type_contrat : undefined,
      date_debut: emp.date_debut || undefined,
      date_fin: emp.date_fin || undefined,
      validiteContrat: emp.is_active ? 'En cours' : 'Expiré',
      qualiteContrat: String(emp.categorie_poste || 'Indéterminée').trim(),
      categorie_poste: emp.categorie_poste && emp.categorie_poste !== '-' ? emp.categorie_poste : undefined,
      region: String(emp.region || '-').trim(),
      departement: String(emp.departement || '-').trim(),
      sousPrefecture: String(emp.sous_prefecture || '-').trim(),
      projets: Array.isArray(emp.projets) ? emp.projets : [],
    };
  });
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { actorType } = useAuth();
  const isRespo = actorType === 'RESPO';
  const [darkMode] = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationEmployee, setLocationEmployee] = useState<Employee | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [renewEmployee, setRenewEmployee] = useState<Employee | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<{ id: string; nom: string }[]>([]);
  const [statsOpen, setStatsOpen] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Récupérer les employés de l'utilisateur connecté
    const fetchEmployees = async () => {
      try {
        const acteurId = authService.getUser()?.acteur_id;
        if (!acteurId) {
          navigate('/login');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const url = isRespo
          ? `${apiUrl}/employees/list-all?page_size=200`
          : `${apiUrl}/employees/list/${acteurId}?page_size=200`;
        const response = await fetch(url, { headers: { ...authService.getAuthHeader() } });

        if (response.ok) {
          const raw = await response.json();
          // L'API retourne {items, total, page, pages} depuis la pagination server-side
          const data: any[] = Array.isArray(raw) ? raw : (raw.items ?? []);

          setEmployees(transformEmployees(data));
          setIsLoading(false);
        } else {
          console.error('Erreur API:', response.status);
          const errorText = await response.text();
          console.error('Détails erreur:', errorText);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des employés:', error);
        setIsLoading(false);
      }
    };

    fetchEmployees();

    // Mettre à jour la date/heure chaque minute
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Extraire les projets uniques
  useEffect(() => {
    const uniqueProjects = new Map<string, { id: string; nom: string }>();
    employees.forEach((emp) => {
      emp.projets?.forEach((proj) => {
        if (!uniqueProjects.has(proj.id)) {
          uniqueProjects.set(proj.id, proj);
        }
      });
    });
    setProjects(Array.from(uniqueProjects.values()).sort((a, b) => a.nom.localeCompare(b.nom)));
  }, [employees]);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.poste.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProject = !selectedProject || emp.projets?.some((proj) => proj.id === selectedProject);
    
    return matchesSearch && matchesProject;
  });

  // Tri par colonne
  const sortedEmployees = sortField
    ? [...filteredEmployees].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      })
    : [...filteredEmployees].reverse();

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

  // Fonction pour gérer le tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };


  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleChangeLocation = (employee: Employee) => {
    setLocationEmployee(employee);
    setIsLocationModalOpen(true);
  };

  const handleCloseLocationModal = () => {
    setIsLocationModalOpen(false);
    setLocationEmployee(null);
  };

  const handleRenewContract = (employee: Employee) => {
    setRenewEmployee(employee);
    setIsRenewModalOpen(true);
  };

  const handleCloseRenewModal = () => {
    setIsRenewModalOpen(false);
    setRenewEmployee(null);
  };

  const handleRenewSuccess = () => {
    // Recharger la liste des employés après une reconduction réussie
    const fetchEmployees = async () => {
      try {
        const acteurId = sessionStorage.getItem('acteur_id');
        if (!acteurId) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const url = isRespo
          ? `${apiUrl}/employees/list-all?page_size=200`
          : `${apiUrl}/employees/list/${acteurId}?page_size=200`;
        const response = await fetch(url, { headers: { ...authService.getAuthHeader() } });

        if (response.ok) {
          const raw = await response.json();
          const data: any[] = Array.isArray(raw) ? raw : (raw.items ?? []);
          setEmployees(transformEmployees(data));
        }
      } catch (err) {
        console.error('Erreur lors du rechargement des employés:', err);
      }
    };

    fetchEmployees();
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateSuccess = (emp: any) => {
    const statut: 'Contractuel' | 'Fonctionnaire' = emp.type_personne === 'Fonctionnaire' ? 'Fonctionnaire' : 'Contractuel';
    const genre: 'M' | 'F' = (emp.genre === 'M' || emp.genre === 'F') ? emp.genre : 'M';

    const newEmployee: Employee = {
      id: emp.id || '',
      nom: String(emp.nom || '').trim(),
      prenom: String(emp.prenom || '').trim(),
      matricule: emp.matricule && emp.matricule !== '-' ? emp.matricule : undefined,
      qualification: String(emp.qualification || 'Inconnu').trim(),
      poste: String(emp.poste || 'Non spécifié').trim(),
      statut,
      genre,
      age: Number(emp.age) || 0,
      date_naissance: emp.date_naissance || undefined,
      contact: emp.contact && emp.contact !== '-' ? emp.contact : undefined,
      diplome: emp.diplome && emp.diplome !== '-' ? emp.diplome : undefined,
      ecole: emp.ecole && emp.ecole !== '-' && typeof emp.ecole === 'string' ? emp.ecole : undefined,
      type_contrat: emp.type_contrat && emp.type_contrat !== '-' ? emp.type_contrat : undefined,
      date_debut: emp.date_debut || undefined,
      date_fin: emp.date_fin || undefined,
      validiteContrat: emp.is_active ? 'En cours' : 'Expiré',
      qualiteContrat: String(emp.categorie_poste || 'Indéterminée').trim(),
      categorie_poste: emp.categorie_poste && emp.categorie_poste !== '-' ? emp.categorie_poste : undefined,
      region: String(emp.region || '-').trim(),
      departement: String(emp.departement || '-').trim(),
      sousPrefecture: String(emp.sous_prefecture || '-').trim(),
      projets: Array.isArray(emp.projets) ? emp.projets : [],
    };

    // Ajouter en fin de tableau : le .reverse() de la liste le placera en premier
    setEmployees(prev => [...prev, newEmployee]);
    setCurrentPage(1);
    setSearchTerm('');
    setSortField(null);
  };

  const exportData = (format: 'csv' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.style.visibility = 'hidden';

    if (format === 'csv') {
      const headers = ['NOM', 'PRÉNOM', 'QUALIFICATION', 'POSTE', 'STATUT', 'GENRE', 'ÂGE', 'VALIDITÉ', 'PROJETS', 'RÉGION', 'DÉPARTEMENT', 'SOUS-PRÉFECTURE'];
      const rows = filteredEmployees.map((emp) => [
        emp.nom,
        emp.prenom,
        emp.qualification,
        emp.poste,
        emp.statut,
        emp.genre,
        emp.age,
        emp.validiteContrat,
        emp.projets?.map((p) => p.nom).join('; ') || '-',
        emp.region,
        emp.departement,
        emp.sousPrefecture,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `employes_${timestamp}.csv`);
    } else if (format === 'pdf') {
      // Générer le PDF avec HTML
      const pdfWindow = window.open('', '', 'width=1200,height=800');
      if (!pdfWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Liste des Employés - ${timestamp}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              padding: 20px;
              color: #2c3e50;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #FF8C00;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #FF8C00;
              font-size: 28px;
              margin-bottom: 5px;
            }
            .header p {
              color: #7f8c8d;
              font-size: 12px;
            }
            .summary {
              display: flex;
              gap: 30px;
              margin-bottom: 30px;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .summary-item {
              flex: 1;
            }
            .summary-item label {
              color: #7f8c8d;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .summary-item value {
              display: block;
              font-size: 18px;
              font-weight: 700;
              color: #FF8C00;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            thead {
              background: #FF8C00;
              color: white;
            }
            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #E67E00;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e0e0e0;
            }
            tbody tr:nth-child(even) {
              background: #f9f9f9;
            }
            tbody tr:hover {
              background: #f0f7ff;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 10px;
              color: #7f8c8d;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Liste des Employés</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <label>Total Employés</label>
              <value>${filteredEmployees.length}</value>
            </div>
            <div class="summary-item">
              <label>Hommes</label>
              <value>${filteredEmployees.filter((e) => e.genre === 'M').length}</value>
            </div>
            <div class="summary-item">
              <label>Femmes</label>
              <value>${filteredEmployees.filter((e) => e.genre === 'F').length}</value>
            </div>
            <div class="summary-item">
              <label>Contrats Actifs</label>
              <value>${filteredEmployees.filter((e) => e.validiteContrat === 'En cours').length}</value>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>NOM</th>
                <th>PRÉNOM</th>
                <th>QUALIFICATION</th>
                <th>POSTE</th>
                <th>STATUT</th>
                <th>GENRE</th>
                <th>ÂGE</th>
                <th>VALIDITÉ</th>
                <th>PROJETS</th>
                <th>RÉGION</th>
                <th>DÉPARTEMENT</th>
                <th>SOUS-PRÉFECTURE</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEmployees.map((emp) => `
                <tr>
                  <td>${emp.nom}</td>
                  <td>${emp.prenom}</td>
                  <td>${emp.qualification}</td>
                  <td>${emp.poste}</td>
                  <td>${emp.statut}</td>
                  <td>${emp.genre === 'M' ? 'Masculin' : 'Féminin'}</td>
                  <td>${emp.age}</td>
                  <td><strong style="color: ${emp.validiteContrat === 'Expiré' ? '#E74C3C' : '#27AE60'}">${emp.validiteContrat}</strong></td>
                  <td>${emp.projets?.map((p) => p.nom).join('; ') || '-'}</td>
                  <td>${emp.region}</td>
                  <td>${emp.departement}</td>
                  <td>${emp.sousPrefecture}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Ce document a été généré automatiquement par le système de gestion des ressources humaines AFOR.</p>
            <p>© 2026 AFOR - Tous droits réservés</p>
          </div>
        </body>
        </html>
      `;

      pdfWindow.document.write(htmlContent);
      pdfWindow.document.close();
      pdfWindow.focus();
      setTimeout(() => {
        pdfWindow.print();
      }, 250);
      setShowExportMenu(false);
      return;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  // Calcul des statistiques réelles
  const total          = employees.length;
  const maleCount      = employees.filter((emp) => emp.genre === 'M').length;
  const femaleCount    = employees.filter((emp) => emp.genre === 'F').length;
  const young          = employees.filter((emp) => emp.age <= 25).length;
  const senior         = employees.filter((emp) => emp.age > 25).length;
  const activeContracts  = employees.filter((emp) => emp.validiteContrat === 'En cours').length;
  const expiredContracts = employees.filter((emp) => emp.validiteContrat === 'Expiré').length;

  const pct = (n: number) => total ? Math.round(n / total * 100) : 0;

  const formatDateTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return currentDateTime.toLocaleDateString('fr-FR', options);
  };

  return (
    <div className={`employees-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="employees-header">
        <div className="header-top">
          <div className="header-left">
            <div className="header-info">
              <h1>Gestion des employés</h1>
              <p className="current-date-time">{formatDateTime()}</p>
            </div>
          </div>
          <div className="header-right">
            <button
              className={`stats-toggle-btn${statsOpen ? ' open' : ''}`}
              onClick={() => setStatsOpen(o => !o)}
              title={statsOpen ? 'Masquer les statistiques' : 'Afficher les statistiques'}
            >
              <BarChart2 size={14} />
              <span>{statsOpen ? 'Masquer stats' : 'Afficher stats'}</span>
              <ChevronDown size={14} className="toggle-chevron" />
            </button>
            <div style={{ position: 'relative' }}>
              <button className="export-btn" onClick={() => setShowExportMenu(!showExportMenu)} title="Exporter">
                <Download size={16} />
                <span>Exporter</span>
              </button>
              {showExportMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                  background: darkMode ? '#161B22' : '#fff',
                  border: `1px solid ${darkMode ? '#30363D' : '#E2E8F0'}`,
                  borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 160, overflow: 'hidden',
                }}>
                  {[{ label: 'Exporter CSV', icon: BarChart2, fn: () => exportData('csv') },
                    { label: 'Exporter PDF', icon: FileText,  fn: () => exportData('pdf') }]
                    .map(item => (
                      <button key={item.label} onClick={item.fn} style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '10px 14px', border: 'none', background: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        color: darkMode ? '#E6EDF3' : '#1A202C',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = darkMode ? '#21262D' : '#F7FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <item.icon size={14} /> {item.label}
                      </button>
                    ))}
                </div>
              )}
            </div>
            {!isRespo && (
              <button className="add-btn" onClick={handleOpenCreateModal}>
                <Plus size={16} />
                <span>Nouvel employé</span>
              </button>
            )}
          </div>
        </div>

        <div className={`kpi-section${statsOpen ? ' open' : ' closed'}`}>
          <div className="stat-cards-row">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="kpi-skeleton" />)
            ) : (<>

              {/* Card genre */}
              <div className="stat-card-v3" style={{ borderTopColor: '#3498DB' }}>
                <div className="sc-header">
                  <div className="sc-icon" style={{ background: '#3498DB18', color: '#3498DB' }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="sc-title">Répartition par genre</p>
                    <p className="sc-total">{total} employé{total !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="sc-rows">
                  <div className="sc-row">
                    <span className="sc-row-label">Hommes</span>
                    <div className="sc-bar-wrap">
                      <div className="sc-bar" style={{ width: `${pct(maleCount)}%`, background: '#3498DB' }} />
                    </div>
                    <span className="sc-row-val">{maleCount} <em>{pct(maleCount)}%</em></span>
                  </div>
                  <div className="sc-row">
                    <span className="sc-row-label">Femmes</span>
                    <div className="sc-bar-wrap">
                      <div className="sc-bar" style={{ width: `${pct(femaleCount)}%`, background: '#9B59B6' }} />
                    </div>
                    <span className="sc-row-val">{femaleCount} <em>{pct(femaleCount)}%</em></span>
                  </div>
                </div>
              </div>

              {/* Card âge */}
              <div className="stat-card-v3" style={{ borderTopColor: '#FF8C00' }}>
                <div className="sc-header">
                  <div className="sc-icon" style={{ background: '#FF8C0018', color: '#FF8C00' }}>
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <p className="sc-title">Tranche d'âge</p>
                    <p className="sc-total">{total} employé{total !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="sc-rows">
                  <div className="sc-row">
                    <span className="sc-row-label">≤ 25 ans</span>
                    <div className="sc-bar-wrap">
                      <div className="sc-bar" style={{ width: `${pct(young)}%`, background: '#FF8C00' }} />
                    </div>
                    <span className="sc-row-val">{young} <em>{pct(young)}%</em></span>
                  </div>
                  <div className="sc-row">
                    <span className="sc-row-label">&gt; 25 ans</span>
                    <div className="sc-bar-wrap">
                      <div className="sc-bar" style={{ width: `${pct(senior)}%`, background: '#F39C12' }} />
                    </div>
                    <span className="sc-row-val">{senior} <em>{pct(senior)}%</em></span>
                  </div>
                </div>
              </div>

              {/* Card contrats */}
              <div className="stat-card-v3" style={{ borderTopColor: '#27AE60' }}>
                <div className="sc-header">
                  <div className="sc-icon" style={{ background: '#27AE6018', color: '#27AE60' }}>
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="sc-title">État des contrats</p>
                    <p className="sc-total">{total} employé{total !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="sc-rows">
                  <div className="sc-row">
                    <span className="sc-row-label">Actifs</span>
                    <div className="sc-bar-wrap">
                      <div className="sc-bar" style={{ width: `${pct(activeContracts)}%`, background: '#27AE60' }} />
                    </div>
                    <span className="sc-row-val">{activeContracts} <em>{pct(activeContracts)}%</em></span>
                  </div>
                  <div className="sc-row">
                    <span className="sc-row-label">Expirés</span>
                    <div className="sc-bar-wrap">
                      <div className="sc-bar" style={{ width: `${pct(expiredContracts)}%`, background: '#E74C3C' }} />
                    </div>
                    <span className="sc-row-val">{expiredContracts} <em>{pct(expiredContracts)}%</em></span>
                  </div>
                </div>
              </div>

            </>)}
          </div>
        </div>

        <div className="ep-filters">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')} title="Effacer">✕</button>
            )}
          </div>
          <div className="project-filter">
            <Layers size={15} className="filter-icon" />
            <select
              value={selectedProject}
              onChange={(e) => { setSelectedProject(e.target.value); setCurrentPage(1); }}
              className="filter-select"
            >
              <option value="">Tous les projets</option>
              {projects.map((proj) => <option key={proj.id} value={proj.id}>{proj.nom}</option>)}
            </select>
          </div>
          <div className="ep-count-badge">
            <Users size={13} />
            <span>{filteredEmployees.length} résultat{filteredEmployees.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="employees-container">
        <div className="table-controls">
          <div className="items-per-page">
            <label>Par page :</label>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="table-info">
            {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredEmployees.length)} sur {filteredEmployees.length}
          </div>
        </div>

        <div className="table-wrapper">
          {isLoading ? (
            <SkeletonLoader type="table-row" count={itemsPerPage} />
          ) : (
          <table className="employees-table">
            <thead>
              <tr>
                {([
                  { key: 'nom',            label: 'Nom' },
                  { key: 'prenom',         label: 'Prénom' },
                  { key: 'qualification',  label: 'Qualification' },
                  { key: 'poste',          label: 'Poste' },
                  { key: 'statut',         label: 'Statut' },
                  { key: 'genre',          label: 'Genre' },
                  { key: 'age',            label: 'Âge' },
                  { key: 'validiteContrat',label: 'Contrat' },
                ] as { key: SortField; label: string }[]).map(col => (
                  <th key={col.key as string} onClick={() => handleSort(col.key as keyof Employee)} className="th-sortable">
                    <span>{col.label}</span>
                    <span className="sort-icon">
                      {sortField === col.key
                        ? sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        : <ArrowUp size={12} className="sort-neutral" />}
                    </span>
                  </th>
                ))}
                <th>Projets</th>
                <th onClick={() => handleSort('region')} className="th-sortable">
                  <span>Région</span>
                  <span className="sort-icon">{sortField === 'region' ? sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUp size={12} className="sort-neutral" />}</span>
                </th>
                <th onClick={() => handleSort('departement')} className="th-sortable">
                  <span>Département</span>
                  <span className="sort-icon">{sortField === 'departement' ? sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUp size={12} className="sort-neutral" />}</span>
                </th>
                <th onClick={() => handleSort('sousPrefecture')} className="th-sortable">
                  <span>Sous-préfecture</span>
                  <span className="sort-icon">{sortField === 'sousPrefecture' ? sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUp size={12} className="sort-neutral" />}</span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.nom}</td>
                  <td>{employee.prenom}</td>
                  <td>{employee.qualification}</td>
                  <td>{employee.poste}</td>
                  <td>
                    <span className={`status-badge status-${employee.statut.toLowerCase()}`}>
                      {employee.statut}
                    </span>
                  </td>
                  <td><span className={`genre-badge genre-${employee.genre.toLowerCase()}`}>{employee.genre === 'M' ? 'Homme' : 'Femme'}</span></td>
                  <td>{employee.age}</td>
                  <td>
                    <span className={`validity-badge ${employee.validiteContrat === 'Expiré' ? 'expired' : ''}`}>
                      {employee.validiteContrat}
                    </span>
                  </td>
                  <td>
                    {employee.projets && employee.projets.length > 0 ? (
                      <div className="proj-list">
                        {employee.projets.map((proj, idx) => (
                          <span key={idx} className="proj-tag">{proj.nom}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="empty-cell">—</span>
                    )}
                  </td>
                  <td>{employee.region}</td>
                  <td>{employee.departement}</td>
                  <td>{employee.sousPrefecture}</td>
                  <td className="actions-cell">
                    <button className="action-btn view-btn" onClick={() => handleViewEmployee(employee)} title="Voir détails">
                      <Eye size={16} />
                    </button>
                    {!isRespo && (
                      <button className="action-btn edit-btn" onClick={() => handleEditEmployee(employee)} title="Modifier">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {!isRespo && (
                      <button className="action-btn location-btn" onClick={() => handleChangeLocation(employee)} title="Changer localisation">
                        <MapPin size={16} />
                      </button>
                    )}
                    {!isRespo && employee.validiteContrat === 'Expiré' && (
                      <button className="action-btn renew-btn" onClick={() => handleRenewContract(employee)} title="Reconduire contrat">
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="no-results">
            <p>Aucun employé trouvé</p>
          </div>
        )}

        {filteredEmployees.length > 0 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
              Précédent
            </button>
            <div className="pagination-info">
              Page {currentPage} sur {totalPages}
            </div>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <EmployeeModal
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        darkMode={darkMode}
      />

      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        darkMode={darkMode}
      />

      <ChangeLocationModal
        employee={locationEmployee}
        isOpen={isLocationModalOpen}
        onClose={handleCloseLocationModal}
        darkMode={darkMode}
      />

      <RenewContractModal
        employee={renewEmployee}
        isOpen={isRenewModalOpen}
        onClose={handleCloseRenewModal}
        darkMode={darkMode}
        onSuccess={handleRenewSuccess}
      />

      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateSuccess}
        darkMode={darkMode}
        acteurId={sessionStorage.getItem('acteur_id') || undefined}
      />
    </div>
  );
}
