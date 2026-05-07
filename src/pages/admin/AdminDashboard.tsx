import { useState, useEffect } from 'react';
import { Users, Briefcase, TrendingUp, Download, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
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
      const [adminRes, dashRes] = await Promise.all([
        fetch(`${apiUrl}/dashboard/admin/stats`),
        fetch(`${apiUrl}/dashboard/operator/all/global`),
      ]);

      if (adminRes.ok) {
        const data = await adminRes.json();
        setAdminStats(data);
      } else {
        console.error('admin/stats failed:', adminRes.status);
      }

      if (dashRes.ok) {
        const data = await dashRes.json();
        console.log('[AdminDashboard] dashData reçu:', {
          zones: data.employees_by_zone?.length,
          genres: data.employees_by_gender?.length,
          postes: data.employees_by_position?.length,
          projets: data.employees_by_project?.length,
          ageGroups: data.age_statistics?.age_groups,
          hires: data.monthly_hires?.length,
        });
        setDashData(data);
      } else {
        const errText = await dashRes.text();
        console.error('operator/all/global failed:', dashRes.status, errText);
        setApiError(`Erreur API ${dashRes.status}: ${errText.slice(0, 120)}`);
      }
    } catch (err: any) {
      console.error('Erreur réseau admin dashboard:', err);
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

  const displayName = user?.nom && user?.prenom ? `${user.prenom} ${user.nom}` : user?.username || 'Administrateur';

  return (
    <div className={`admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
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
          <h2>Bienvenue {displayName}</h2>
        </div>

        {apiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.2rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, color: '#856404', fontSize: '0.85rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{apiError}</span>
            <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#ffc107', border: 'none', borderRadius: 3, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader size={36} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon actors">
                  <Users size={32} />
                </div>
                <div className="stat-info">
                  <h3>Total Acteurs</h3>
                  <p className="stat-number">{adminStats?.total_acteurs ?? '--'}</p>
                  <span className="stat-desc">Opérateurs, Écoles, Agences</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon personnel">
                  <Briefcase size={32} />
                </div>
                <div className="stat-info">
                  <h3>Total Personnel</h3>
                  <p className="stat-number">{adminStats?.total_personnel ?? '--'}</p>
                  <span className="stat-desc">Tous les employés</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon active">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-info">
                  <h3>Employés Actifs</h3>
                  <p className="stat-number">{adminStats?.employes_actifs ?? '--'}</p>
                  <span className="stat-desc">En poste actuellement</span>
                </div>
              </div>
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
