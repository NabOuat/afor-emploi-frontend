import { useState, useEffect } from 'react';
import { Users, Briefcase, TrendingUp, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/AdminDashboard.css';

interface DashboardStats {
  totalActeurs: number;
  totalPersonnel: number;
  employesActifs: number;
  darkMode: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalActeurs: 17,
    totalPersonnel: 1287,
    employesActifs: 1127,
    darkMode: false,
  });

  const [activeChart, setActiveChart] = useState('region');

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setStats(prev => ({ ...prev, darkMode: savedDarkMode }));
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, []);

  useEffect(() => {
    if (stats.darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [stats.darkMode]);

  const regionData = [
    { name: 'Cascades', value: 180 },
    { name: 'Centre', value: 220 },
    { name: 'Centre-Est', value: 150 },
    { name: 'Centre-Nord', value: 140 },
    { name: 'Centre-Ouest', value: 160 },
    { name: 'Est', value: 130 },
    { name: 'Hauts-Bassins', value: 190 },
    { name: 'Nord', value: 170 },
  ];

  const evolutionData = [
    { mois: 'Jan', employes: 950 },
    { mois: 'Fév', employes: 1000 },
    { mois: 'Mar', employes: 1050 },
    { mois: 'Avr', employes: 1090 },
    { mois: 'Mai', employes: 1120 },
    { mois: 'Juin', employes: 1127 },
  ];

  const genreData = [
    { name: 'Hommes', value: 680 },
    { name: 'Femmes', value: 447 },
  ];

  const ageData = [
    { tranche: '18-25', count: 150 },
    { tranche: '26-35', count: 380 },
    { tranche: '36-45', count: 420 },
    { tranche: '46-55', count: 140 },
    { tranche: '56+', count: 37 },
  ];

  const posteData = [
    { nom: 'Opérateur', count: 450 },
    { nom: 'Superviseur', count: 280 },
    { nom: 'Coordinateur', count: 220 },
    { nom: 'Gestionnaire', count: 177 },
  ];

  const diplomeData = [
    { nom: 'Bac', count: 320 },
    { nom: 'Licence', count: 580 },
    { nom: 'Master', count: 227 },
  ];

  const COLORS = ['#FF8C00', '#FFB84D', '#E67E00', '#FF6B35', '#FF9D3D', '#FFD580'];

  return (
    <div className={`admin-dashboard ${stats.darkMode ? 'dark-mode' : ''}`}>
      <div className="admin-header">
        <div className="admin-header-top">
          <h1>Tableau de Bord Administrateur</h1>
          <div className="admin-header-info">
            <span className="org-name">AGENCE FONCIERE RURALE</span>
            <span className="timestamp">Mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>

      </div>

      <div className="admin-content">
        <div className="welcome-section">
          <h2>Bienvenue Nabaga Ouattara</h2>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon actors">
              <Users size={32} />
            </div>
            <div className="stat-info">
              <h3>Total Acteurs</h3>
              <p className="stat-number">{stats.totalActeurs}</p>
              <span className="stat-desc">Opérateurs, Écoles, Agences</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon personnel">
              <Briefcase size={32} />
            </div>
            <div className="stat-info">
              <h3>Total Personnel</h3>
              <p className="stat-number">{stats.totalPersonnel}</p>
              <span className="stat-desc">Tous les employés</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <TrendingUp size={32} />
            </div>
            <div className="stat-info">
              <h3>Employés Actifs</h3>
              <p className="stat-number">{stats.employesActifs}</p>
              <span className="stat-desc">En poste actuellement</span>
            </div>
          </div>
        </div>

        <div className="charts-section">
          <div className="charts-header">
            <h2>Analyses et Statistiques</h2>
            <div className="charts-controls">
              <span>Afficher:</span>
              <button 
                className={`chart-btn ${activeChart === 'region' ? 'active' : ''}`}
                onClick={() => setActiveChart('region')}
              >
                Répartition par Région
              </button>
              <button 
                className={`chart-btn ${activeChart === 'departement' ? 'active' : ''}`}
                onClick={() => setActiveChart('departement')}
              >
                Répartition par Département
              </button>
              <button 
                className={`chart-btn ${activeChart === 'sousprefecture' ? 'active' : ''}`}
                onClick={() => setActiveChart('sousprefecture')}
              >
                Répartition par Sous-Préfecture
              </button>
              <button 
                className={`chart-btn ${activeChart === 'evolution' ? 'active' : ''}`}
                onClick={() => setActiveChart('evolution')}
              >
                Évolution des Effectifs
              </button>
              <button 
                className={`chart-btn ${activeChart === 'genre' ? 'active' : ''}`}
                onClick={() => setActiveChart('genre')}
              >
                Répartition par Genre
              </button>
              <button 
                className={`chart-btn ${activeChart === 'age' ? 'active' : ''}`}
                onClick={() => setActiveChart('age')}
              >
                Tranches d'Âge
              </button>
              <button 
                className={`chart-btn ${activeChart === 'poste' ? 'active' : ''}`}
                onClick={() => setActiveChart('poste')}
              >
                Répartition par Poste
              </button>
              <button 
                className={`chart-btn ${activeChart === 'diplome' ? 'active' : ''}`}
                onClick={() => setActiveChart('diplome')}
              >
                Répartition par Diplôme
              </button>
            </div>
          </div>

          <div className="charts-grid">
            {activeChart === 'region' && (
              <div className="chart-container">
                <h3>Répartition par Région</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF8C00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'evolution' && (
              <div className="chart-container">
                <h3>Évolution des Effectifs</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="employes" stroke="#FF8C00" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'genre' && (
              <div className="chart-container">
                <h3>Répartition par Genre</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'age' && (
              <div className="chart-container">
                <h3>Tranches d'Âge</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tranche" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF8C00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'poste' && (
              <div className="chart-container">
                <h3>Répartition par Poste</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={posteData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nom, count }) => `${nom}: ${count}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {posteData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChart === 'diplome' && (
              <div className="chart-container">
                <h3>Répartition par Diplôme</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={diplomeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nom" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF8C00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {(activeChart === 'departement' || activeChart === 'sousprefecture') && (
              <div className="chart-container">
                <h3>{activeChart === 'departement' ? 'Répartition par Département' : 'Répartition par Sous-Préfecture'}</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF8C00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="export-section">
          <button className="btn-export">
            <Download size={18} />
            Export Complet (Toutes les données)
          </button>
          <p className="export-note">Les fichiers sont générés au format Excel (.xlsx) avec l'horodatage</p>
        </div>
      </div>
    </div>
  );
}
