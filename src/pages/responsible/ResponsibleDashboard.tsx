import { useState, useEffect } from 'react';
import {
  Moon, Sun,
  BarChart3, Users, Briefcase, MapPin, TrendingUp,
  AlertTriangle, Building2, ClipboardList, GraduationCap,
  Calendar, AlertCircle, CheckCircle, Clock, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
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

interface EvolutionEffectif {
  mois: string;
  effectif: number;
}

interface GroupeAge {
  tranche: string;
  nombre: number;
  pourcentage: number;
}

interface NiveauEducation {
  niveau: string;
  nombre: number;
  pourcentage: number;
}

interface EmbauchesMensuelles {
  mois: string;
  nombre: number;
}

interface ZoneNonCouverte {
  region: string;
  objectif: number;
  couverture: number;
  deficit: number;
}

const CHART_COLORS = ['#FF8C00', '#3498DB', '#27AE60', '#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C'];

export default function ResponsibleDashboard() {
  const { logout: _logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterContrats, setFilterContrats] = useState<'tous' | 'actifs' | 'inactifs'>('tous');

  const [stats, setStats] = useState<StatistiqueRH | null>(null);
  const [contratsEcheance, setContratsEcheance] = useState<ContratsEcheance | null>(null);
  const [effectifParRegion, setEffectifParRegion] = useState<EffectifParRegion[]>([]);
  const [evolutionEffectifs, setEvolutionEffectifs] = useState<EvolutionEffectif[]>([]);
  const [groupeAge, setGroupeAge] = useState<GroupeAge[]>([]);
  const [niveauEducation, setNiveauEducation] = useState<NiveauEducation[]>([]);
  const [embauchesMensuelles, setEmbauchesMensuelles] = useState<EmbauchesMensuelles[]>([]);
  const [zonesNonCouverte, setZonesNonCouverte] = useState<ZoneNonCouverte[]>([]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) document.documentElement.classList.add('dark-mode');
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [filterContrats]);

  const getFilteredEmployees = (employees: any[]): any[] => {
    if (filterContrats === 'actifs') return employees.filter((e: any) => e.validiteContrat === 'En cours');
    if (filterContrats === 'inactifs') return employees.filter((e: any) => e.validiteContrat === 'Expiré');
    return employees;
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const acteurId = sessionStorage.getItem('acteur_id');
      const response = await fetch(`${apiUrl}/employees/list/${acteurId}`);
      if (response.ok) {
        const employees = await response.json();
        const filtered = getFilteredEmployees(employees);
        setStats(calculateStatistics(filtered));
        setContratsEcheance(calculateContratsEcheance(filtered));
        setEffectifParRegion(calculateEffectifParRegion(filtered));
        setEvolutionEffectifs(calculateEvolutionEffectifs(filtered));
        setGroupeAge(calculateGroupeAge(filtered));
        setNiveauEducation(calculateNiveauEducation(filtered));
        setEmbauchesMensuelles(calculateEmbauchesMensuelles(filtered));
        setZonesNonCouverte(calculateZonesNonCouverte(filtered));
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
    const dureesContrats = employees
      .filter((e: any) => e.date_debut && e.date_fin)
      .map((e: any) => {
        const debut = new Date(e.date_debut);
        const fin = new Date(e.date_fin);
        return (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
      });
    return {
      totalEmployes, cdi, cdd, consultant, hommes, femmes,
      tauxFeminisation: totalEmployes > 0 ? Math.round((femmes / totalEmployes) * 100) : 0,
      ageMin: ages.length > 0 ? Math.min(...ages) : 0,
      ageMax: ages.length > 0 ? Math.max(...ages) : 0,
      ageMoyen, contratsActifs, contratsExpires,
      tauxRenouvellement: totalEmployes > 0 ? Math.round((contratsExpires / totalEmployes) * 100) : 0,
      ratioPermanentTemporaire: `${cdi}/${cdd + consultant}`,
      dureemoyenneContrats: dureesContrats.length > 0
        ? Math.round(dureesContrats.reduce((a: number, b: number) => a + b, 0) / dureesContrats.length) : 0,
    };
  };

  const calculateContratsEcheance = (employees: any[]): ContratsEcheance => {
    const today = new Date();
    const d3 = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    const d6 = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
    const d12 = new Date(today.getFullYear(), today.getMonth() + 12, today.getDate());
    return {
      dans3mois: employees.filter((e: any) => {
        if (!e.date_fin || e.validiteContrat !== 'En cours') return false;
        const fin = new Date(e.date_fin);
        return fin <= d3 && fin > today;
      }).length,
      dans6mois: employees.filter((e: any) => {
        if (!e.date_fin || e.validiteContrat !== 'En cours') return false;
        const fin = new Date(e.date_fin);
        return fin <= d6 && fin > d3;
      }).length,
      dans12mois: employees.filter((e: any) => {
        if (!e.date_fin || e.validiteContrat !== 'En cours') return false;
        const fin = new Date(e.date_fin);
        return fin <= d12 && fin > d6;
      }).length,
    };
  };

  const calculateEffectifParRegion = (employees: any[]): EffectifParRegion[] => {
    const map = new Map<string, number>();
    employees.forEach((e: any) => {
      const r = e.region || 'Non spécifiée';
      map.set(r, (map.get(r) || 0) + 1);
    });
    const total = employees.length;
    return Array.from(map.entries())
      .map(([region, effectif]) => ({ region, effectif, pourcentage: total > 0 ? Math.round((effectif / total) * 100) : 0 }))
      .sort((a, b) => b.effectif - a.effectif)
      .slice(0, 8);
  };

  const calculateEvolutionEffectifs = (employees: any[]): EvolutionEffectif[] => {
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      const mois = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const effectif = employees.filter((e: any) => {
        if (!e.date_debut) return false;
        const debut = new Date(e.date_debut);
        const fin = e.date_fin ? new Date(e.date_fin) : new Date('2099-12-31');
        return debut <= date && fin >= date;
      }).length;
      return { mois, effectif: effectif || employees.length };
    });
  };

  const calculateGroupeAge = (employees: any[]): GroupeAge[] => {
    const groupes: Record<string, number> = { '< 25': 0, '25–34': 0, '35–44': 0, '45–54': 0, '55+': 0 };
    const total = employees.length;
    employees.forEach((e: any) => {
      if (e.age) {
        if (e.age < 25) groupes['< 25']++;
        else if (e.age < 35) groupes['25–34']++;
        else if (e.age < 45) groupes['35–44']++;
        else if (e.age < 55) groupes['45–54']++;
        else groupes['55+']++;
      }
    });
    return Object.entries(groupes).map(([tranche, nombre]) => ({
      tranche, nombre, pourcentage: total > 0 ? Math.round((nombre / total) * 100) : 0,
    }));
  };

  const calculateNiveauEducation = (employees: any[]): NiveauEducation[] => {
    const map = new Map<string, number>();
    const total = employees.length;
    employees.forEach((e: any) => {
      const n = e.diplome || 'Non spécifié';
      map.set(n, (map.get(n) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([niveau, nombre]) => ({ niveau, nombre, pourcentage: total > 0 ? Math.round((nombre / total) * 100) : 0 }))
      .sort((a, b) => b.nombre - a.nombre)
      .slice(0, 6);
  };

  const calculateEmbauchesMensuelles = (employees: any[]): EmbauchesMensuelles[] => {
    const today = new Date();
    const map = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      map.set(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), 0);
    }
    employees.forEach((e: any) => {
      if (e.date_debut) {
        const key = new Date(e.date_debut).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([mois, nombre]) => ({ mois, nombre }));
  };

  const calculateZonesNonCouverte = (employees: any[]): ZoneNonCouverte[] => {
    const objectifs: Record<string, number> = {
      Abidjan: 25, Bouaké: 12, Yamoussoukro: 15, Korhogo: 12,
      'San-Pédro': 8, Daloa: 10, Gagnoa: 10, Duekoué: 8,
    };
    const map = new Map<string, number>();
    employees.forEach((e: any) => {
      const r = e.region || 'Non spécifiée';
      map.set(r, (map.get(r) || 0) + 1);
    });
    return Array.from(map.entries()).map(([region, effectif]) => {
      const objectif = objectifs[region] || 10;
      return { region, objectif, couverture: Math.round((effectif / objectif) * 100), deficit: Math.max(0, objectif - effectif) };
    }).sort((a, b) => a.couverture - b.couverture);
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    document.documentElement.classList.toggle('dark-mode', next);
  };

  const genreData = stats ? [
    { name: 'Hommes', value: stats.hommes },
    { name: 'Femmes', value: stats.femmes },
  ] : [];

  const contratsTypeData = stats ? [
    { name: 'CDI', value: stats.cdi },
    { name: 'CDD', value: stats.cdd },
    { name: 'Consultant', value: stats.consultant },
  ] : [];

  const statutContratData = stats ? [
    { name: 'Actifs', value: stats.contratsActifs },
    { name: 'Expirés', value: stats.contratsExpires },
  ] : [];

  const kpiCards = [
    { label: 'Effectif Total', value: stats?.totalEmployes ?? '--', icon: Users, color: '#FF8C00', bg: 'rgba(255,140,0,0.1)', sub: 'Employés enregistrés' },
    { label: 'Contrats Actifs', value: stats?.contratsActifs ?? '--', icon: CheckCircle, color: '#27AE60', bg: 'rgba(39,174,96,0.1)', sub: 'En cours' },
    { label: 'Taux Féminisation', value: stats ? `${stats.tauxFeminisation}%` : '--', icon: TrendingUp, color: '#3498DB', bg: 'rgba(52,152,219,0.1)', sub: `${stats?.femmes ?? 0} femmes` },
    { label: 'Âge Moyen', value: stats ? `${stats.ageMoyen} ans` : '--', icon: Clock, color: '#9B59B6', bg: 'rgba(155,89,182,0.1)', sub: `Min ${stats?.ageMin ?? 0} · Max ${stats?.ageMax ?? 0}` },
  ];

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={`rd-container ${darkMode ? 'dark' : ''}`}>
      {/* Main */}
      <main className="rd-main">
        {/* Header */}
        <header className="rd-header">
          <div className="rd-header-left">
            <h1 className="rd-title">Tableau de Bord</h1>
            <p className="rd-subtitle">{today}</p>
          </div>
          <div className="rd-header-right">
            <select
              className="rd-filter-select"
              value={filterContrats}
              onChange={(e) => setFilterContrats(e.target.value as 'tous' | 'actifs' | 'inactifs')}
            >
              <option value="tous">Tous les employés</option>
              <option value="actifs">Contrats actifs</option>
              <option value="inactifs">Contrats expirés</option>
            </select>
          </div>
        </header>

        {/* KPI Row */}
        <section className="rd-kpi-grid">
          {kpiCards.map((k, i) => (
            <div key={i} className="rd-kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
              <div className="rd-kpi-icon" style={{ background: k.bg, color: k.color }}>
                <k.icon size={22} />
              </div>
              <div className="rd-kpi-body">
                <p className="rd-kpi-label">{k.label}</p>
                <p className="rd-kpi-value">{loading ? '—' : k.value}</p>
                <p className="rd-kpi-sub">{k.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Charts Grid */}
        <section className="rd-charts-grid">

          {/* Évolution effectifs */}
          <div className="rd-chart-card rd-span-2">
            <div className="rd-chart-header">
              <TrendingUp size={18} className="rd-chart-icon" />
              <h3>Évolution des Effectifs (12 mois)</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolutionEffectifs} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3a3a5c' : '#f0f0f0'} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="effectif" stroke="#FF8C00" strokeWidth={2} dot={{ r: 3 }} name="Effectif" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Effectif par région */}
          <div className="rd-chart-card rd-span-2">
            <div className="rd-chart-header">
              <MapPin size={18} className="rd-chart-icon" />
              <h3>Effectif par Région</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={effectifParRegion} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3a3a5c' : '#f0f0f0'} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Effectif']} />
                <Bar dataKey="effectif" fill="#FF8C00" radius={[4, 4, 0, 0]} name="Effectif" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Genre */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <Users size={18} className="rd-chart-icon" />
              <h3>Répartition par Genre</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={genreData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {genreData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Groupes d'âge */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <BarChart3 size={18} className="rd-chart-icon" />
              <h3>Pyramide des Âges</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={groupeAge} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3a3a5c' : '#f0f0f0'} />
                <XAxis dataKey="tranche" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="nombre" fill="#3498DB" radius={[4, 4, 0, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Types de contrats */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <Briefcase size={18} className="rd-chart-icon" />
              <h3>Types de Contrats</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={contratsTypeData} cx="50%" cy="50%" outerRadius={85} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {contratsTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Embauches mensuelles */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <Calendar size={18} className="rd-chart-icon" />
              <h3>Embauches Mensuelles</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={embauchesMensuelles} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3a3a5c' : '#f0f0f0'} />
                <XAxis dataKey="mois" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Embauches']} />
                <Bar dataKey="nombre" fill="#27AE60" radius={[4, 4, 0, 0]} name="Embauches" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Niveau d'éducation */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <GraduationCap size={18} className="rd-chart-icon" />
              <h3>Niveau d'Éducation</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={niveauEducation} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3a3a5c' : '#f0f0f0'} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="niveau" type="category" tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={(v) => [v, 'Employés']} />
                <Bar dataKey="nombre" fill="#9B59B6" radius={[0, 4, 4, 0]} name="Employés" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statut contrats + Alertes échéances */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <ClipboardList size={18} className="rd-chart-icon" />
              <h3>Statut des Contrats</h3>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statutContratData} cx="50%" cy="50%" outerRadius={65} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  <Cell fill="#27AE60" />
                  <Cell fill="#E74C3C" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="rd-chart-header" style={{ marginTop: '16px' }}>
              <AlertTriangle size={18} style={{ color: '#F39C12', flexShrink: 0 }} />
              <h3>Contrats Arrivant à Échéance</h3>
            </div>
            <div className="rd-alert-grid">
              <div className="rd-alert-item rd-alert-danger">
                <AlertCircle size={16} />
                <div>
                  <p className="rd-alert-count">{loading ? '—' : contratsEcheance?.dans3mois}</p>
                  <p className="rd-alert-label">Dans 3 mois</p>
                </div>
              </div>
              <div className="rd-alert-item rd-alert-warning">
                <Clock size={16} />
                <div>
                  <p className="rd-alert-count">{loading ? '—' : contratsEcheance?.dans6mois}</p>
                  <p className="rd-alert-label">Dans 6 mois</p>
                </div>
              </div>
              <div className="rd-alert-item rd-alert-info">
                <Calendar size={16} />
                <div>
                  <p className="rd-alert-count">{loading ? '—' : contratsEcheance?.dans12mois}</p>
                  <p className="rd-alert-label">Dans 12 mois</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Indicateurs RH */}
        <section className="rd-section">
          <div className="rd-section-header">
            <Building2 size={18} className="rd-chart-icon" />
            <h2>Indicateurs RH</h2>
          </div>
          <div className="rd-info-grid">
            {[
              { label: 'CDI', value: stats?.cdi, icon: CheckCircle, color: '#27AE60' },
              { label: 'CDD', value: stats?.cdd, icon: Briefcase, color: '#3498DB' },
              { label: 'Consultant', value: stats?.consultant, icon: User, color: '#9B59B6' },
              { label: 'Taux de Renouvellement', value: stats ? `${stats.tauxRenouvellement}%` : '--', icon: TrendingUp, color: '#F39C12' },
              { label: 'Ratio Permanent/Temp.', value: stats?.ratioPermanentTemporaire, icon: BarChart3, color: '#FF8C00' },
              { label: 'Durée Moy. Contrats', value: stats ? `${stats.dureemoyenneContrats} mois` : '--', icon: Clock, color: '#E74C3C' },
            ].map((item, i) => (
              <div key={i} className="rd-info-card">
                <div className="rd-info-icon" style={{ color: item.color }}>
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="rd-info-label">{item.label}</p>
                  <p className="rd-info-value">{loading ? '—' : item.value ?? '--'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Couverture géographique */}
        <section className="rd-section">
          <div className="rd-section-header">
            <AlertCircle size={18} style={{ color: '#E74C3C', flexShrink: 0 }} />
            <h2>Couverture Géographique vs Objectifs</h2>
          </div>
          <div className="rd-coverage-table">
            <div className="rd-coverage-head">
              <span>Région</span>
              <span>Objectif</span>
              <span>Couverture</span>
              <span>Déficit</span>
              <span>Statut</span>
            </div>
            {loading ? (
              <div className="rd-coverage-row"><span>Chargement...</span></div>
            ) : zonesNonCouverte.length > 0 ? zonesNonCouverte.map((z, i) => (
              <div key={i} className="rd-coverage-row">
                <span className="rd-coverage-region">
                  <ChevronRight size={14} />
                  {z.region}
                </span>
                <span>{z.objectif}</span>
                <span className="rd-progress-cell">
                  <div className="rd-progress-bar">
                    <div className="rd-progress-fill" style={{
                      width: `${Math.min(z.couverture, 100)}%`,
                      background: z.couverture >= 100 ? '#27AE60' : z.couverture >= 80 ? '#F39C12' : '#E74C3C'
                    }} />
                  </div>
                  <span className="rd-progress-text">{z.couverture}%</span>
                </span>
                <span className={z.deficit > 0 ? 'rd-deficit' : 'rd-surplus'}>{z.deficit > 0 ? `-${z.deficit}` : '✓'}</span>
                <span className={`rd-status-badge ${z.couverture >= 100 ? 'rd-ok' : z.couverture >= 80 ? 'rd-warn' : 'rd-crit'}`}>
                  {z.couverture >= 100 ? 'Atteint' : z.couverture >= 80 ? 'Proche' : 'Critique'}
                </span>
              </div>
            )) : (
              <div className="rd-coverage-row"><span>Aucune donnée</span></div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
