import { useState, useEffect } from 'react';
import { Users, Briefcase, TrendingUp, Download, Loader, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import authService from '../../services/authService';
import '../../styles/AdminDashboard.css';

interface AdminStats {
  total_acteurs: number;
  total_personnel: number;
  employes_actifs: number;
  total_projets: number;
  acteurs_par_type: Record<string, number>;
}

interface DashboardData {
  stats: { total_employees: number; active_contracts: number; young_employees_over_25: number; };
  employees_by_position: { position: string; count: number }[];
  employees_by_zone: { region: string; departement: string; count: number }[];
  employees_by_gender: { gender: string; count: number; percentage: number }[];
  age_statistics: { average_age: number; min_age: number; max_age: number; age_groups: Record<string, number> };
  employees_by_project: { project_id: string; project_name: string; count: number }[];
  monthly_hires: { month: string; count: number }[];
}

const COLORS = ['#FF8C00', '#3498DB', '#27AE60', '#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [darkMode] = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [activeChart, setActiveChart] = useState('region');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const authHeaders = authService.getAuthHeader();
      const [adminRes, dashRes] = await Promise.all([
        fetch(`${apiUrl}/dashboard/admin/stats`, { headers: authHeaders }),
        fetch(`${apiUrl}/dashboard/operator/all/global`, { headers: authHeaders }),
      ]);

      if (adminRes.ok) {
        setAdminStats(await adminRes.json());
      } else if (adminRes.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (dashRes.ok) {
        setDashData(await dashRes.json());
      } else if (dashRes.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        const errText = await dashRes.text();
        setApiError(`Erreur API ${dashRes.status}: ${errText.slice(0, 120)}`);
      }
    } catch (err: any) {
      setApiError(`Erreur réseau: ${err?.message || 'impossible de joindre le serveur'}`);
    } finally {
      setLoading(false);
    }
  };

  const regionData = (dashData?.employees_by_zone || [])
    .reduce<{ name: string; value: number }[]>((acc, z) => {
      const existing = acc.find(r => r.name === z.region);
      if (existing) existing.value += z.count;
      else acc.push({ name: z.region, value: z.count });
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const deptData = (dashData?.employees_by_zone || [])
    .map(z => ({ name: z.departement, value: z.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const genreData = (dashData?.employees_by_gender || []).map(g => ({
    name: g.gender === 'M' ? 'Hommes' : g.gender === 'F' ? 'Femmes' : g.gender,
    value: g.count,
  }));

  const ageData = dashData?.age_statistics
    ? Object.entries(dashData.age_statistics.age_groups).map(([tranche, count]) => ({ tranche, count }))
    : [];

  const posteData = (dashData?.employees_by_position || []).slice(0, 6).map(p => ({ nom: p.position, count: p.count }));

  const hiresData = (dashData?.monthly_hires || []).map(h => {
    const d = new Date(h.month + '-01');
    return { mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), count: h.count };
  });

  const projectData = (dashData?.employees_by_project || []).slice(0, 8).map(p => ({ name: p.project_name, value: p.count }));

  const tk = darkMode ? '#8B949E' : '#718096';
  const gr = darkMode ? '#30363D' : '#E2E8F0';
  const displayName = user?.nom && user?.prenom ? `${user.prenom} ${user.nom}` : user?.username || 'Administrateur';

  const kpiCards = [
    { label: 'Total Acteurs',     value: adminStats?.total_acteurs   ?? '--', icon: Users,       color: '#FF8C00', description: 'Opérateurs, Écoles, Agences' },
    { label: 'Total Personnel',   value: adminStats?.total_personnel  ?? '--', icon: Briefcase,   color: '#3498DB', description: 'Tous les employés' },
    { label: 'Employés Actifs',   value: adminStats?.employes_actifs  ?? '--', icon: TrendingUp,  color: '#27AE60', description: 'En poste actuellement' },
    { label: 'Total Projets',     value: adminStats?.total_projets    ?? '--', icon: CheckCircle, color: '#9B59B6', description: 'Projets enregistrés' },
  ];

  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>

      {/* Header V3 */}
      <div className="admin-header">
        <div className="header-content">
          <h1>Tableau de bord <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem', padding: '2px 10px', borderRadius: 999, background: '#FF8C00', color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', verticalAlign: 'middle' }}>AD</span></h1>
          <p>Vue globale — {displayName} · <span style={{ color: tk, fontSize: '0.78rem' }}>Mise à jour : {new Date().toLocaleTimeString('fr-FR')}</span></p>
        </div>
        <div className="header-buttons">
          <button className="btn-primary" onClick={fetchData} title="Rafraîchir"><RefreshCw size={15} /></button>
          <button className="btn-primary"><Download size={15} />Exporter</button>
        </div>
      </div>

      <div className="admin-content">

        {apiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', background: darkMode ? '#1a1a2e' : '#fff3cd', border: `1px solid ${darkMode ? '#E74C3C44' : '#ffc107'}`, borderRadius: 10, color: darkMode ? '#ff8080' : '#856404', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{apiError}</span>
            <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#FF8C00', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: '#fff' }}>
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            <Loader size={36} className="spinner-icon" />
            <p>Chargement des données…</p>
          </div>
        ) : (
          <>
            {/* KPI — 4 colonnes */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {kpiCards.map((card, i) => (
                <div key={i} className="stat-card" style={{ '--stat-color': card.color } as React.CSSProperties}>
                  <div className="stat-icon" style={{ backgroundColor: card.color + '18', color: card.color }}>
                    <card.icon size={20} />
                  </div>
                  <div className="stat-content">
                    <p className="stat-label">{card.label}</p>
                    <h3 className="stat-value">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</h3>
                    <p className="stat-description">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="charts-section">
              <div className="charts-header">
                <h2>Analyses et Statistiques</h2>
                <div className="charts-controls">
                  <span>Afficher:</span>
                  {[
                    { key: 'region', label: 'Par Région' },
                    { key: 'departement', label: 'Par Département' },
                    { key: 'projet', label: 'Par Projet' },
                    { key: 'evolution', label: 'Embauches' },
                    { key: 'genre', label: 'Par Genre' },
                    { key: 'age', label: "Tranches d'Âge" },
                    { key: 'poste', label: 'Par Poste' },
                  ].map(btn => (
                    <button
                      key={btn.key}
                      className={`chart-btn ${activeChart === btn.key ? 'active' : ''}`}
                      onClick={() => setActiveChart(btn.key)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
                {!dashData && !loading && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>
                    Aucune donnée disponible. Vérifiez que le serveur est démarré.
                  </div>
                )}

                {activeChart === 'region' && (
                  <div className="chart-container">
                    <h3>Répartition par Région {regionData.length > 0 && `(${regionData.length} régions)`}</h3>
                    {regionData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={regionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#FF8C00" radius={[4, 4, 0, 0]} name="Employés" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {activeChart === 'departement' && (
                  <div className="chart-container">
                    <h3>Répartition par Département (Top 10)</h3>
                    {deptData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={deptData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3498DB" radius={[4, 4, 0, 0]} name="Employés" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {activeChart === 'projet' && (
                  <div className="chart-container">
                    <h3>Employés par Projet</h3>
                    {projectData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={Math.max(300, projectData.length * 50)}>
                        <BarChart data={projectData} layout="vertical" margin={{ left: 120 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#27AE60" radius={[0, 4, 4, 0]} name="Employés" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {activeChart === 'evolution' && (
                  <div className="chart-container">
                    <h3>Embauches Mensuelles (12 mois)</h3>
                    {hiresData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={hiresData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#FF8C00" radius={[4, 4, 0, 0]} name="Embauches" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {activeChart === 'genre' && (
                  <div className="chart-container">
                    <h3>Répartition par Genre</h3>
                    {genreData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={genreData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={150}
                            dataKey="value"
                          >
                            {genreData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {activeChart === 'age' && (
                  <div className="chart-container">
                    <h3>Tranches d'Âge</h3>
                    {ageData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={ageData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="tranche" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#9B59B6" radius={[4, 4, 0, 0]} name="Employés" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {activeChart === 'poste' && (
                  <div className="chart-container">
                    <h3>Répartition par Poste (Top 6)</h3>
                    {posteData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a98b0' }}>Aucune donnée</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={posteData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ nom, count }) => `${nom}: ${count}`}
                            outerRadius={150}
                            dataKey="count"
                            nameKey="nom"
                          >
                          {posteData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    )}
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
          </>
        )}
      </div>
    </div>
  );
}
