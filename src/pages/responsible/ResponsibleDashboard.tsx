import { useState, useEffect } from 'react';
import { LayoutDashboard, User, LogOut, Moon, Sun, Menu, X, BarChart3, Users, Briefcase, MapPin, TrendingUp, Globe, Award, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../styles/ResponsibleDashboard.css';

interface StatistiqueRH {
  totalEmployes: number;
  cdi: number;
  cdd: number;
  consultant: number;
  hommes: number;
  femmes: number;
  tauxFeminisation: number;
  ageMin: number;
  ageMax: number;
  ageMoyen: number;
  contratsActifs: number;
  contratsExpires: number;
  tauxRenouvellement: number;
  ratioPermanentTemporaire: string;
  dureemoyenneContrats: number;
}

interface StatistiqueProjet {
  nomProjet: string;
  nombrePersonnes: number;
  tauxOccupation: number;
  budgetRH: number;
}

interface StatistiqueGeographique {
  region: string;
  effectif: number;
  departements: number;
  sousPrefectures: number;
}

interface ContratsEcheance {
  dans3mois: number;
  dans6mois: number;
  dans12mois: number;
}

interface EffectifParRegion {
  region: string;
  effectif: number;
  pourcentage: number;
}

interface TauxOccupationProjet {
  nomProjet: string;
  nombrePersonnes: number;
  capaciteMax: number;
  tauxOccupation: number;
}

interface PerformanceActeur {
  nomActeur: string;
  nombreEmployes: number;
  tauxActivite: number;
  contratsActifs: number;
  tauxRenouvellement: number;
  dureemoyenneService: number;
  coutMoyenParEmploye: number;
}

interface EvolutionEffectif {
  mois: string;
  effectif: number;
}

interface TauxOccupationEngagement {
  nomEngagement: string;
  nombrePersonnes: number;
  capaciteMax: number;
  tauxOccupation: number;
}

interface CouvertureGeographique {
  region: string;
  couverture: number; // pourcentage
  intensite: 'faible' | 'moyen' | 'fort'; // pour la carte de chaleur
}

interface ZoneNonCouverte {
  region: string;
  departements: number;
  sousPrefectures: number;
  objectif: number;
  couverture: number;
  deficit: number;
}

interface EmployeParPoste {
  poste: string;
  nombre: number;
  pourcentage: number;
}

interface EmployeParZone {
  region: string;
  departement: string;
  nombre: number;
}

interface StatutContrat {
  actifs: number;
  completes: number;
  aVenir: number;
}

interface NiveauEducation {
  niveau: string;
  nombre: number;
  pourcentage: number;
}

interface TopEcole {
  ecole: string;
  nombre: number;
}

interface EmbauchesMensuelles {
  mois: string;
  nombre: number;
}

interface GroupeAge {
  tranche: string;
  nombre: number;
  pourcentage: number;
}

export default function ResponsibleDashboard() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('vue-ensemble');
  const [loading, setLoading] = useState(true);
  const [filterContrats, setFilterContrats] = useState<'tous' | 'actifs' | 'inactifs'>('tous');
  const [stats, setStats] = useState<StatistiqueRH | null>(null);
  const [contratsEcheance, setContratsEcheance] = useState<ContratsEcheance | null>(null);
  const [effectifParRegion, setEffectifParRegion] = useState<EffectifParRegion[]>([]);
  const [tauxOccupationProjets, setTauxOccupationProjets] = useState<TauxOccupationProjet[]>([]);
  const [performanceActeurs, setPerformanceActeurs] = useState<PerformanceActeur[]>([]);
  const [evolutionEffectifs, setEvolutionEffectifs] = useState<EvolutionEffectif[]>([]);
  const [tauxOccupationEngagements, setTauxOccupationEngagements] = useState<TauxOccupationEngagement[]>([]);
  const [couvertureGeographique, setCouvertureGeographique] = useState<CouvertureGeographique[]>([]);
  const [zonesNonCouverte, setZonesNonCouverte] = useState<ZoneNonCouverte[]>([]);
  const [employeParPoste, setEmployeParPoste] = useState<EmployeParPoste[]>([]);
  const [employeParZone, setEmployeParZone] = useState<EmployeParZone[]>([]);
  const [statutContrat, setStatutContrat] = useState<StatutContrat | null>(null);
  const [niveauEducation, setNiveauEducation] = useState<NiveauEducation[]>([]);
  const [topEcoles, setTopEcoles] = useState<TopEcole[]>([]);
  const [embauchesMensuelles, setEmbauchesMensuelles] = useState<EmbauchesMensuelles[]>([]);
  const [groupeAge, setGroupeAge] = useState<GroupeAge[]>([]);

  const getFilteredEmployees = (employees: any[]): any[] => {
    if (filterContrats === 'actifs') {
      return employees.filter((e: any) => e.validiteContrat === 'En cours');
    } else if (filterContrats === 'inactifs') {
      return employees.filter((e: any) => e.validiteContrat === 'Expiré');
    }
    return employees;
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
    
    // Charger les statistiques
    fetchStatistics();
  }, [filterContrats]);

  const fetchStatistics = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const acteurId = localStorage.getItem('acteur_id');
      
      const response = await fetch(`${apiUrl}/employees/list/${acteurId}`);
      if (response.ok) {
        const employees = await response.json();
        const filteredEmployees = getFilteredEmployees(employees);
        
        // Calculer toutes les statistiques
        const stats = calculateStatistics(filteredEmployees);
        const echeance = calculateContratsEcheance(filteredEmployees);
        const regions = calculateEffectifParRegion(filteredEmployees);
        const projets = calculateTauxOccupationProjets(filteredEmployees);
        const acteurs = calculatePerformanceActeurs(filteredEmployees);
        const evolution = calculateEvolutionEffectifs(filteredEmployees);
        const engagements = calculateTauxOccupationEngagements(filteredEmployees);
        const couverture = calculateCouvertureGeographique(filteredEmployees);
        const zonesNonCouvertes = calculateZonesNonCouverte(filteredEmployees);
        const postes = calculateEmployeParPoste(filteredEmployees);
        const zones = calculateEmployeParZone(filteredEmployees);
        const contrats = calculateStatutContrat(filteredEmployees);
        const education = calculateNiveauEducation(filteredEmployees);
        const ecoles = calculateTopEcoles(filteredEmployees);
        const embauches = calculateEmbauchesMensuelles(filteredEmployees);
        const ages = calculateGroupeAge(filteredEmployees);
        
        setStats(stats);
        setContratsEcheance(echeance);
        setEffectifParRegion(regions);
        setTauxOccupationProjets(projets);
        setPerformanceActeurs(acteurs);
        setEvolutionEffectifs(evolution);
        setTauxOccupationEngagements(engagements);
        setCouvertureGeographique(couverture);
        setZonesNonCouverte(zonesNonCouvertes);
        setEmployeParPoste(postes);
        setEmployeParZone(zones);
        setStatutContrat(contrats);
        setNiveauEducation(education);
        setTopEcoles(ecoles);
        setEmbauchesMensuelles(embauches);
        setGroupeAge(ages);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (employees: any[]): StatistiqueRH => {
    const totalEmployes = employees.length;
    const cdi = employees.filter((e: any) => e.type_contrat === 'CDI').length;
    const cdd = employees.filter((e: any) => e.type_contrat === 'CDD').length;
    const consultant = employees.filter((e: any) => e.type_contrat === 'Consultant').length;
    const hommes = employees.filter((e: any) => e.genre === 'M').length;
    const femmes = employees.filter((e: any) => e.genre === 'F').length;
    const contratsActifs = employees.filter((e: any) => e.validiteContrat === 'En cours').length;
    const contratsExpires = employees.filter((e: any) => e.validiteContrat === 'Expiré').length;
    
    const ages = employees.filter((e: any) => e.age).map((e: any) => e.age);
    const ageMoyen = ages.length > 0 ? Math.round(ages.reduce((a: number, b: number) => a + b, 0) / ages.length) : 0;
    const ageMin = ages.length > 0 ? Math.min(...ages) : 0;
    const ageMax = ages.length > 0 ? Math.max(...ages) : 0;

    // Ratio permanent/temporaire
    const permanent = cdi;
    const temporaire = cdd + consultant;
    const ratioPermanentTemporaire = temporaire > 0 ? `${permanent}/${temporaire}` : `${permanent}/0`;

    // Durée moyenne des contrats
    const dureesContrats = employees
      .filter((e: any) => e.date_debut && e.date_fin)
      .map((e: any) => {
        const debut = new Date(e.date_debut);
        const fin = new Date(e.date_fin);
        const mois = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
        return mois;
      });
    const dureemoyenneContrats = dureesContrats.length > 0 
      ? Math.round(dureesContrats.reduce((a: number, b: number) => a + b, 0) / dureesContrats.length)
      : 0;

    return {
      totalEmployes,
      cdi,
      cdd,
      consultant,
      hommes,
      femmes,
      tauxFeminisation: totalEmployes > 0 ? Math.round((femmes / totalEmployes) * 100) : 0,
      ageMin,
      ageMax,
      ageMoyen,
      contratsActifs,
      contratsExpires,
      tauxRenouvellement: totalEmployes > 0 ? Math.round((contratsExpires / totalEmployes) * 100) : 0,
      ratioPermanentTemporaire,
      dureemoyenneContrats,
    };
  };

  const calculateContratsEcheance = (employees: any[]): ContratsEcheance => {
    const today = new Date();
    const dans3mois = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    const dans6mois = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
    const dans12mois = new Date(today.getFullYear(), today.getMonth() + 12, today.getDate());

    const contrats3mois = employees.filter((e: any) => {
      if (!e.date_fin || e.validiteContrat !== 'En cours') return false;
      const fin = new Date(e.date_fin);
      return fin <= dans3mois && fin > today;
    }).length;

    const contrats6mois = employees.filter((e: any) => {
      if (!e.date_fin || e.validiteContrat !== 'En cours') return false;
      const fin = new Date(e.date_fin);
      return fin <= dans6mois && fin > dans3mois;
    }).length;

    const contrats12mois = employees.filter((e: any) => {
      if (!e.date_fin || e.validiteContrat !== 'En cours') return false;
      const fin = new Date(e.date_fin);
      return fin <= dans12mois && fin > dans6mois;
    }).length;

    return {
      dans3mois: contrats3mois,
      dans6mois: contrats6mois,
      dans12mois: contrats12mois,
    };
  };

  const calculateEffectifParRegion = (employees: any[]): EffectifParRegion[] => {
    const regions = new Map<string, number>();
    
    employees.forEach((emp: any) => {
      const region = emp.region || 'Non spécifiée';
      regions.set(region, (regions.get(region) || 0) + 1);
    });

    const total = employees.length;
    return Array.from(regions.entries())
      .map(([region, effectif]) => ({
        region,
        effectif,
        pourcentage: total > 0 ? Math.round((effectif / total) * 100) : 0,
      }))
      .sort((a, b) => b.effectif - a.effectif);
  };

  const calculateTauxOccupationProjets = (employees: any[]): TauxOccupationProjet[] => {
    const projets = new Map<string, number>();
    
    employees.forEach((emp: any) => {
      if (emp.projets && Array.isArray(emp.projets)) {
        emp.projets.forEach((proj: any) => {
          projets.set(proj.nom, (projets.get(proj.nom) || 0) + 1);
        });
      }
    });

    return Array.from(projets.entries())
      .map(([nomProjet, nombrePersonnes]) => ({
        nomProjet,
        nombrePersonnes,
        capaciteMax: Math.ceil(nombrePersonnes * 1.2),
        tauxOccupation: Math.round((nombrePersonnes / (Math.ceil(nombrePersonnes * 1.2))) * 100),
      }))
      .sort((a, b) => b.nombrePersonnes - a.nombrePersonnes);
  };

  const calculatePerformanceActeurs = (employees: any[]): PerformanceActeur[] => {
    const contratsActifs = employees.filter((e: any) => e.validiteContrat === 'En cours').length;
    const contratsExpires = employees.filter((e: any) => e.validiteContrat === 'Expiré').length;
    const tauxRenouvellement = employees.length > 0 ? Math.round((contratsExpires / employees.length) * 100) : 0;
    
    // Durée moyenne de service
    const dureesService = employees
      .filter((e: any) => e.date_debut)
      .map((e: any) => {
        const debut = new Date(e.date_debut);
        const today = new Date();
        const mois = (today.getFullYear() - debut.getFullYear()) * 12 + (today.getMonth() - debut.getMonth());
        return mois;
      });
    const dureemoyenneService = dureesService.length > 0 
      ? Math.round(dureesService.reduce((a: number, b: number) => a + b, 0) / dureesService.length)
      : 0;

    return [
      {
        nomActeur: 'AFOR',
        nombreEmployes: employees.length,
        tauxActivite: contratsActifs > 0 ? Math.round((contratsActifs / employees.length) * 100) : 0,
        contratsActifs,
        tauxRenouvellement,
        dureemoyenneService,
        coutMoyenParEmploye: 0, // À intégrer avec données de coûts
      },
    ];
  };

  const calculateEvolutionEffectifs = (employees: any[]): EvolutionEffectif[] => {
    // Générer les 12 derniers mois
    const evolution: EvolutionEffectif[] = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const moisAnnee = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      
      // Compter les employés actifs à cette date
      const effectif = employees.filter((e: any) => {
        if (!e.date_debut) return false;
        const debut = new Date(e.date_debut);
        const fin = e.date_fin ? new Date(e.date_fin) : new Date('2099-12-31');
        return debut <= date && fin >= date;
      }).length;
      
      evolution.push({
        mois: moisAnnee,
        effectif: effectif || employees.length,
      });
    }
    
    return evolution;
  };

  const calculateTauxOccupationEngagements = (employees: any[]): TauxOccupationEngagement[] => {
    const engagements = new Map<string, number>();
    
    employees.forEach((emp: any) => {
      // À adapter selon la structure réelle des engagements
      const engagement = emp.engagement || 'Non spécifié';
      engagements.set(engagement, (engagements.get(engagement) || 0) + 1);
    });

    return Array.from(engagements.entries())
      .map(([nomEngagement, nombrePersonnes]) => ({
        nomEngagement,
        nombrePersonnes,
        capaciteMax: Math.ceil(nombrePersonnes * 1.3),
        tauxOccupation: Math.round((nombrePersonnes / (Math.ceil(nombrePersonnes * 1.3))) * 100),
      }))
      .sort((a, b) => b.nombrePersonnes - a.nombrePersonnes);
  };

  const calculateCouvertureGeographique = (employees: any[]): CouvertureGeographique[] => {
    const regions = new Map<string, number>();
    const totalEmployes = employees.length;
    
    employees.forEach((emp: any) => {
      const region = emp.region || 'Non spécifiée';
      regions.set(region, (regions.get(region) || 0) + 1);
    });

    return Array.from(regions.entries())
      .map(([region, effectif]) => {
        const couverture = totalEmployes > 0 ? Math.round((effectif / totalEmployes) * 100) : 0;
        let intensite: 'faible' | 'moyen' | 'fort' = 'faible';
        if (couverture >= 30) intensite = 'fort';
        else if (couverture >= 15) intensite = 'moyen';
        
        return {
          region,
          couverture,
          intensite,
        };
      })
      .sort((a, b) => b.couverture - a.couverture);
  };

  const calculateZonesNonCouverte = (employees: any[]): ZoneNonCouverte[] => {
    const regions = new Map<string, number>();
    const totalEmployes = employees.length;
    
    // Objectifs de couverture par région (à adapter selon vos objectifs)
    const objectifs: { [key: string]: number } = {
      'Yamoussoukro': 15,
      'Abidjan': 25,
      'Gagnoa': 10,
      'Korhogo': 12,
      'Bouaké': 12,
      'San-Pédro': 8,
      'Daloa': 10,
      'Duekoué': 8,
    };
    
    employees.forEach((emp: any) => {
      const region = emp.region || 'Non spécifiée';
      regions.set(region, (regions.get(region) || 0) + 1);
    });

    return Array.from(regions.entries())
      .map(([region, effectif]) => {
        const objectif = objectifs[region] || 10;
        const couverture = Math.round((effectif / objectif) * 100);
        const deficit = Math.max(0, objectif - effectif);
        
        return {
          region,
          departements: Math.ceil(effectif / 3),
          sousPrefectures: Math.ceil(effectif / 2),
          objectif,
          couverture,
          deficit,
        };
      })
      .sort((a, b) => a.couverture - b.couverture);
  };

  const calculateEmployeParPoste = (employees: any[]): EmployeParPoste[] => {
    const postes = new Map<string, number>();
    const totalEmployes = employees.length;
    
    employees.forEach((emp: any) => {
      const poste = emp.poste || 'Non spécifié';
      postes.set(poste, (postes.get(poste) || 0) + 1);
    });

    return Array.from(postes.entries())
      .map(([poste, nombre]) => ({
        poste,
        nombre,
        pourcentage: totalEmployes > 0 ? Math.round((nombre / totalEmployes) * 100) : 0,
      }))
      .sort((a, b) => b.nombre - a.nombre);
  };

  const calculateEmployeParZone = (employees: any[]): EmployeParZone[] => {
    const zones = new Map<string, number>();
    
    employees.forEach((emp: any) => {
      const key = `${emp.region || 'Non spécifiée'}|${emp.departement || 'Non spécifié'}`;
      zones.set(key, (zones.get(key) || 0) + 1);
    });

    return Array.from(zones.entries())
      .map(([key, nombre]) => {
        const [region, departement] = key.split('|');
        return { region, departement, nombre };
      })
      .sort((a, b) => b.nombre - a.nombre)
      .slice(0, 10); // Top 10
  };

  const calculateStatutContrat = (employees: any[]): StatutContrat => {
    const today = new Date();
    const actifs = employees.filter((e: any) => e.validiteContrat === 'En cours').length;
    const completes = employees.filter((e: any) => e.validiteContrat === 'Expiré').length;
    const aVenir = employees.filter((e: any) => {
      if (!e.date_debut) return false;
      const debut = new Date(e.date_debut);
      return debut > today;
    }).length;

    return { actifs, completes, aVenir };
  };

  const calculateNiveauEducation = (employees: any[]): NiveauEducation[] => {
    const niveaux = new Map<string, number>();
    const totalEmployes = employees.length;
    
    employees.forEach((emp: any) => {
      const niveau = emp.diplome || 'Non spécifié';
      niveaux.set(niveau, (niveaux.get(niveau) || 0) + 1);
    });

    return Array.from(niveaux.entries())
      .map(([niveau, nombre]) => ({
        niveau,
        nombre,
        pourcentage: totalEmployes > 0 ? Math.round((nombre / totalEmployes) * 100) : 0,
      }))
      .sort((a, b) => b.nombre - a.nombre);
  };

  const calculateTopEcoles = (employees: any[]): TopEcole[] => {
    const ecoles = new Map<string, number>();
    
    employees.forEach((emp: any) => {
      if (emp.ecole && emp.ecole !== '-') {
        ecoles.set(emp.ecole, (ecoles.get(emp.ecole) || 0) + 1);
      }
    });

    return Array.from(ecoles.entries())
      .map(([ecole, nombre]) => ({ ecole, nombre }))
      .sort((a, b) => b.nombre - a.nombre)
      .slice(0, 10); // Top 10
  };

  const calculateEmbauchesMensuelles = (employees: any[]): EmbauchesMensuelles[] => {
    const embauches = new Map<string, number>();
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const moisAnnee = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      embauches.set(moisAnnee, 0);
    }

    employees.forEach((emp: any) => {
      if (emp.date_debut) {
        const debut = new Date(emp.date_debut);
        const moisAnnee = debut.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (embauches.has(moisAnnee)) {
          embauches.set(moisAnnee, (embauches.get(moisAnnee) || 0) + 1);
        }
      }
    });

    return Array.from(embauches.entries()).map(([mois, nombre]) => ({ mois, nombre }));
  };

  const calculateGroupeAge = (employees: any[]): GroupeAge[] => {
    const groupes: { [key: string]: number } = {
      '< 25 ans': 0,
      '25-35 ans': 0,
      '35-45 ans': 0,
      '45-55 ans': 0,
      '> 55 ans': 0,
    };
    const totalEmployes = employees.length;

    employees.forEach((emp: any) => {
      if (emp.age) {
        if (emp.age < 25) groupes['< 25 ans']++;
        else if (emp.age < 35) groupes['25-35 ans']++;
        else if (emp.age < 45) groupes['35-45 ans']++;
        else if (emp.age < 55) groupes['45-55 ans']++;
        else groupes['> 55 ans']++;
      }
    });

    return Object.entries(groupes).map(([tranche, nombre]) => ({
      tranche,
      nombre,
      pourcentage: totalEmployes > 0 ? Math.round((nombre / totalEmployes) * 100) : 0,
    }));
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('acteur_id');
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <div className={`responsible-dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Navbar Latérale */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>AFOR</h2>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === 'vue-ensemble' ? 'active' : ''}`}
            onClick={() => setActiveTab('vue-ensemble')}
          >
            <LayoutDashboard size={20} />
            {sidebarOpen && <span>Tableau de Bord</span>}
          </button>
          
          <button
            className={`menu-item ${activeTab === 'profil' ? 'active' : ''}`}
            onClick={handleProfile}
          >
            <User size={20} />
            {sidebarOpen && <span>Profil</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="menu-item" onClick={toggleDarkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {sidebarOpen && <span>{darkMode ? 'Mode Clair' : 'Mode Sombre'}</span>}
          </button>
          
          <button className="menu-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </nav>

      {/* Contenu Principal */}
      <div className="main-content">
        <header className="dashboard-header">
          <h1>Tableau de Bord - Responsable</h1>
          <p>Statistiques Stratégiques pour la Direction</p>
        </header>

        {/* Vue d'Ensemble */}
        {activeTab === 'vue-ensemble' && (
          <div className="dashboard-content">
            {/* Section 1: Vue d'ensemble RH */}
            <section className="dashboard-section">
              <h2>📊 Vue d'Ensemble des Ressources Humaines</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 140, 0, 0.1)' }}>
                    <Users size={24} color="#FF8C00" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Effectif Total Actif</p>
                    <p className="stat-value">{loading ? '--' : stats?.totalEmployes}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)' }}>
                    <Briefcase size={24} color="#3498DB" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Contrats Actifs</p>
                    <p className="stat-value">{loading ? '--' : stats?.contratsActifs}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)' }}>
                    <TrendingUp size={24} color="#27AE60" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Taux de Féminisation</p>
                    <p className="stat-value">{loading ? '--' : `${stats?.tauxFeminisation}%`}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(230, 126, 34, 0.1)' }}>
                    <Clock size={24} color="#E67E22" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Âge Moyen</p>
                    <p className="stat-value">{loading ? '--' : `${stats?.ageMoyen} ans`}</p>
                  </div>
                </div>
              </div>

              {/* Filtrage Contrats Actifs/Inactifs */}
              <div className="filter-switch-container">
                <span className="filter-label">Filtrer par statut :</span>
                <div className="filter-buttons">
                  <button 
                    className={`filter-btn ${filterContrats === 'tous' ? 'active' : ''}`}
                    onClick={() => setFilterContrats('tous')}
                  >
                    Tous
                  </button>
                  <button 
                    className={`filter-btn ${filterContrats === 'actifs' ? 'active' : ''}`}
                    onClick={() => setFilterContrats('actifs')}
                  >
                    Actifs
                  </button>
                  <button 
                    className={`filter-btn ${filterContrats === 'inactifs' ? 'active' : ''}`}
                    onClick={() => setFilterContrats('inactifs')}
                  >
                    Inactifs
                  </button>
                </div>
              </div>

              {/* Détails par Type de Contrat */}
              <div className="details-grid">
                <div className="detail-card">
                  <h3>Distribution par Type de Contrat</h3>
                  <div className="detail-item">
                    <span>CDI</span>
                    <span className="value">{loading ? '--' : stats?.cdi}</span>
                  </div>
                  <div className="detail-item">
                    <span>CDD</span>
                    <span className="value">{loading ? '--' : stats?.cdd}</span>
                  </div>
                  <div className="detail-item">
                    <span>Consultant</span>
                    <span className="value">{loading ? '--' : stats?.consultant}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <h3>Répartition par Genre</h3>
                  <div className="detail-item">
                    <span>Hommes</span>
                    <span className="value">{loading ? '--' : stats?.hommes}</span>
                  </div>
                  <div className="detail-item">
                    <span>Femmes</span>
                    <span className="value">{loading ? '--' : stats?.femmes}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <h3>Pyramide des Âges</h3>
                  <div className="detail-item">
                    <span>Âge Min</span>
                    <span className="value">{loading ? '--' : `${stats?.ageMin} ans`}</span>
                  </div>
                  <div className="detail-item">
                    <span>Âge Max</span>
                    <span className="value">{loading ? '--' : `${stats?.ageMax} ans`}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <h3>Indicateurs Clés</h3>
                  <div className="detail-item">
                    <span>Contrats Expirés</span>
                    <span className="value">{loading ? '--' : stats?.contratsExpires}</span>
                  </div>
                  <div className="detail-item">
                    <span>Taux Renouvellement</span>
                    <span className="value">{loading ? '--' : `${stats?.tauxRenouvellement}%`}</span>
                  </div>
                  <div className="detail-item">
                    <span>Ratio Permanent/Temporaire</span>
                    <span className="value">{loading ? '--' : stats?.ratioPermanentTemporaire}</span>
                  </div>
                  <div className="detail-item">
                    <span>Durée Moyenne Contrats</span>
                    <span className="value">{loading ? '--' : `${stats?.dureemoyenneContrats} mois`}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Contrats Arrivant à Échéance */}
            <section className="dashboard-section">
              <h2>⏰ Contrats Arrivant à Échéance</h2>
              <div className="details-grid">
                <div className="detail-card">
                  <h3>Dans 3 Mois</h3>
                  <div className="detail-item">
                    <span>Nombre de contrats</span>
                    <span className="value">{loading ? '--' : contratsEcheance?.dans3mois}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <h3>Dans 6 Mois</h3>
                  <div className="detail-item">
                    <span>Nombre de contrats</span>
                    <span className="value">{loading ? '--' : contratsEcheance?.dans6mois}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <h3>Dans 12 Mois</h3>
                  <div className="detail-item">
                    <span>Nombre de contrats</span>
                    <span className="value">{loading ? '--' : contratsEcheance?.dans12mois}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Effectif Déployé par Région */}
            <section className="dashboard-section">
              <h2>🌍 Effectif Déployé par Région</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : effectifParRegion.length > 0 ? (
                  effectifParRegion.map((region, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{region.region}</h3>
                      <div className="detail-item">
                        <span>Effectif</span>
                        <span className="value">{region.effectif}</span>
                      </div>
                      <div className="detail-item">
                        <span>Pourcentage</span>
                        <span className="value">{region.pourcentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 4: Taux d'Occupation par Projet */}
            <section className="dashboard-section">
              <h2>📊 Taux d'Occupation par Projet</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : tauxOccupationProjets.length > 0 ? (
                  tauxOccupationProjets.map((projet, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{projet.nomProjet}</h3>
                      <div className="detail-item">
                        <span>Personnes</span>
                        <span className="value">{projet.nombrePersonnes}</span>
                      </div>
                      <div className="detail-item">
                        <span>Taux d'Occupation</span>
                        <span className="value">{projet.tauxOccupation}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucun projet assigné</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 5: Évolution Effectifs 12/24 Mois */}
            <section className="dashboard-section">
              <h2>📈 Évolution Effectifs 12/24 Mois</h2>
              <div className="evolution-table">
                <div className="evolution-header">
                  <span>Période</span>
                  <span>Effectif</span>
                </div>
                {loading ? (
                  <div className="evolution-row">
                    <span>Chargement...</span>
                  </div>
                ) : evolutionEffectifs.length > 0 ? (
                  evolutionEffectifs.map((item, idx) => (
                    <div key={idx} className="evolution-row">
                      <span>{item.mois}</span>
                      <span className="value">{item.effectif}</span>
                    </div>
                  ))
                ) : (
                  <div className="evolution-row">
                    <span>Aucune donnée disponible</span>
                  </div>
                )}
              </div>
            </section>

            {/* Section 6: Taux d'Occupation par Engagement */}
            <section className="dashboard-section">
              <h2>💼 Taux d'Occupation par Engagement</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : tauxOccupationEngagements.length > 0 ? (
                  tauxOccupationEngagements.map((engagement, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{engagement.nomEngagement}</h3>
                      <div className="detail-item">
                        <span>Personnes</span>
                        <span className="value">{engagement.nombrePersonnes}</span>
                      </div>
                      <div className="detail-item">
                        <span>Capacité Max</span>
                        <span className="value">{engagement.capaciteMax}</span>
                      </div>
                      <div className="detail-item">
                        <span>Taux d'Occupation</span>
                        <span className="value">{engagement.tauxOccupation}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucun engagement assigné</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 7: Performance par Acteur (Détails Avancés) */}
            <section className="dashboard-section">
              <h2>🏢 Performance par Acteur (Détails Avancés)</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : performanceActeurs.length > 0 ? (
                  performanceActeurs.map((acteur, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{acteur.nomActeur}</h3>
                      <div className="detail-item">
                        <span>Employés</span>
                        <span className="value">{acteur.nombreEmployes}</span>
                      </div>
                      <div className="detail-item">
                        <span>Taux d'Activité</span>
                        <span className="value">{acteur.tauxActivite}%</span>
                      </div>
                      <div className="detail-item">
                        <span>Contrats Actifs</span>
                        <span className="value">{acteur.contratsActifs}</span>
                      </div>
                      <div className="detail-item">
                        <span>Taux Renouvellement</span>
                        <span className="value">{acteur.tauxRenouvellement}%</span>
                      </div>
                      <div className="detail-item">
                        <span>Durée Moyenne Service</span>
                        <span className="value">{acteur.dureemoyenneService} mois</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 8: Employés par Poste */}
            <section className="dashboard-section">
              <h2>💼 Employés par Poste</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : employeParPoste.length > 0 ? (
                  employeParPoste.map((poste, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{poste.poste}</h3>
                      <div className="detail-item">
                        <span>Nombre</span>
                        <span className="value">{poste.nombre}</span>
                      </div>
                      <div className="detail-item">
                        <span>Pourcentage</span>
                        <span className="value">{poste.pourcentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 9: Statut des Contrats */}
            <section className="dashboard-section">
              <h2>📋 Statut des Contrats</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)' }}>
                    <CheckCircle size={24} color="#27AE60" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Contrats Actifs</p>
                    <p className="stat-value">{loading ? '--' : statutContrat?.actifs}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)' }}>
                    <Clock size={24} color="#3498DB" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Contrats Complétés</p>
                    <p className="stat-value">{loading ? '--' : statutContrat?.completes}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(230, 126, 34, 0.1)' }}>
                    <AlertCircle size={24} color="#E67E22" />
                  </div>
                  <div className="stat-info">
                    <p className="stat-label">Contrats À Venir</p>
                    <p className="stat-value">{loading ? '--' : statutContrat?.aVenir}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 10: Niveau d'Éducation */}
            <section className="dashboard-section">
              <h2>🎓 Niveau d'Éducation</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : niveauEducation.length > 0 ? (
                  niveauEducation.map((niveau, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{niveau.niveau}</h3>
                      <div className="detail-item">
                        <span>Nombre</span>
                        <span className="value">{niveau.nombre}</span>
                      </div>
                      <div className="detail-item">
                        <span>Pourcentage</span>
                        <span className="value">{niveau.pourcentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 11: Top Écoles */}
            <section className="dashboard-section">
              <h2>🏫 Top Écoles</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : topEcoles.length > 0 ? (
                  topEcoles.map((ecole, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{ecole.ecole}</h3>
                      <div className="detail-item">
                        <span>Nombre d'employés</span>
                        <span className="value">{ecole.nombre}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 12: Embauches Mensuelles */}
            <section className="dashboard-section">
              <h2>📅 Embauches Mensuelles (12 derniers mois)</h2>
              <div className="evolution-table">
                <div className="evolution-header">
                  <span>Mois</span>
                  <span>Nombre d'embauches</span>
                </div>
                {loading ? (
                  <div className="evolution-row">
                    <span>Chargement...</span>
                  </div>
                ) : embauchesMensuelles.length > 0 ? (
                  embauchesMensuelles.map((item, idx) => (
                    <div key={idx} className="evolution-row">
                      <span>{item.mois}</span>
                      <span className="value">{item.nombre}</span>
                    </div>
                  ))
                ) : (
                  <div className="evolution-row">
                    <span>Aucune donnée disponible</span>
                  </div>
                )}
              </div>
            </section>

            {/* Section 13: Groupes d'Âge */}
            <section className="dashboard-section">
              <h2>👥 Distribution par Groupes d'Âge</h2>
              <div className="details-grid">
                {loading ? (
                  <div className="detail-card">
                    <p>Chargement...</p>
                  </div>
                ) : groupeAge.length > 0 ? (
                  groupeAge.map((groupe, idx) => (
                    <div key={idx} className="detail-card">
                      <h3>{groupe.tranche}</h3>
                      <div className="detail-item">
                        <span>Nombre</span>
                        <span className="value">{groupe.nombre}</span>
                      </div>
                      <div className="detail-item">
                        <span>Pourcentage</span>
                        <span className="value">{groupe.pourcentage}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="detail-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 14: Carte de Chaleur Géographique */}
            <section className="dashboard-section">
              <h2>🗺️ Carte de Chaleur - Présence des Acteurs sur le Territoire</h2>
              <div className="heatmap-grid">
                {loading ? (
                  <div className="heatmap-card">
                    <p>Chargement...</p>
                  </div>
                ) : couvertureGeographique.length > 0 ? (
                  couvertureGeographique.map((region, idx) => {
                    let bgColor = 'rgba(255, 200, 100, 0.2)'; // faible
                    let borderColor = '#FFB84D';
                    if (region.intensite === 'moyen') {
                      bgColor = 'rgba(255, 140, 0, 0.3)';
                      borderColor = '#FF8C00';
                    } else if (region.intensite === 'fort') {
                      bgColor = 'rgba(255, 100, 0, 0.4)';
                      borderColor = '#E67E00';
                    }
                    
                    return (
                      <div key={idx} className="heatmap-card" style={{ backgroundColor: bgColor, borderLeft: `4px solid ${borderColor}` }}>
                        <h3>{region.region}</h3>
                        <div className="heatmap-intensity">
                          <span className="intensity-label">Intensité: {region.intensite.toUpperCase()}</span>
                          <span className="intensity-value">{region.couverture}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="heatmap-card">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </section>

            {/* Section 15: Zones Non Couvertes vs Objectifs */}
            <section className="dashboard-section">
              <h2>⚠️ Zones Non Couvertes vs Objectifs</h2>
              <div className="coverage-table">
                <div className="coverage-header">
                  <span>Région</span>
                  <span>Objectif</span>
                  <span>Couverture</span>
                  <span>Déficit</span>
                  <span>Statut</span>
                </div>
                {loading ? (
                  <div className="coverage-row">
                    <span>Chargement...</span>
                  </div>
                ) : zonesNonCouverte.length > 0 ? (
                  zonesNonCouverte.map((zone, idx) => (
                    <div key={idx} className="coverage-row">
                      <span className="region-name">{zone.region}</span>
                      <span className="value">{zone.objectif}</span>
                      <span className="value">{zone.couverture}%</span>
                      <span className="value deficit">{zone.deficit}</span>
                      <span className={`status ${zone.couverture >= 100 ? 'atteint' : zone.couverture >= 80 ? 'proche' : 'critique'}`}>
                        {zone.couverture >= 100 ? '✓ Atteint' : zone.couverture >= 80 ? '⚠ Proche' : '✗ Critique'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="coverage-row">
                    <span>Aucune donnée disponible</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
