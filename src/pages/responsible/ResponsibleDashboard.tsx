import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Moon, Sun, Send,
  BarChart3, Users, Briefcase, MapPin, TrendingUp,
  AlertTriangle, Building2, ClipboardList, GraduationCap,
  Calendar, AlertCircle, CheckCircle, Clock, Filter, Search,
  Download, ChevronDown, FileSpreadsheet, Presentation
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportToExcel, exportToPowerPoint, exportSectionToExcel } from '../../utils/dashboardExport';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import '../../styles/ResponsibleDashboard.css';
import { useDarkMode } from '../../hooks/useDarkMode';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  genre: string;
  age: number;
  poste: string;
  type_contrat: string;
  date_debut: string | null;
  date_fin: string | null;
  validiteContrat: string;
  is_active: boolean;
  region: string;
  diplome: string;
  acteur_id: string;
  acteur_nom: string;
  type_acteur: string;
  projets: { id: string; nom: string }[];
}

interface ActeurOption { id: string; nom: string; type_acteur: string; }
interface ProjetOption { id: string; nom: string; nom_complet: string; }

export default function ResponsibleDashboard() {
  const { logout: _logout, user } = useAuth();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportToast, setReportToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [acteurs, setActeurs] = useState<ActeurOption[]>([]);
  const [projets, setProjets] = useState<ProjetOption[]>([]);

  const [filterStatus, setFilterStatus] = useState<'tous' | 'actifs'>('tous');
  const [filterActeurId, setFilterActeurId] = useState('');
  const [filterProjetId, setFilterProjetId] = useState('');
  const [searchText, setSearchText] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  // ── Close export dropdown on outside click ──────────────────
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  // ── Load filter options ─────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/employees/acteurs-of-af`).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/employees/projets-all`).then(r => r.json()).catch(() => []),
    ]).then(([a, p]) => { setActeurs(a); setProjets(p); });
  }, [apiUrl]);

  // ── Load employees when acteur/projet filter changes ────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterActeurId) params.set('filter_acteur_id', filterActeurId);
    if (filterProjetId) params.set('filter_projet_id', filterProjetId);
    setLoading(true);
    fetch(`${apiUrl}/employees/list-all?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setAllEmployees(Array.isArray(data) ? data : []))
      .catch(() => setAllEmployees([]))
      .finally(() => setLoading(false));
  }, [apiUrl, filterActeurId, filterProjetId]);

  // ── Send report manually ────────────────────────────────────
  const handleSendReport = async () => {
    if (!user?.username) return;
    setSendingReport(true);
    try {
      const res = await fetch(`${apiUrl}/auth/send-test-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Échec de l'envoi");
      }
      setReportToast({ type: 'success', msg: 'Rapport envoyé par email !' });
    } catch (e: any) {
      setReportToast({ type: 'error', msg: e.message || "Erreur d'envoi" });
    } finally {
      setSendingReport(false);
      setTimeout(() => setReportToast(null), 3500);
    }
  };

  // ── Client-side filters (status + search) ──────────────────
  const employees = useMemo(() => {
    let list = allEmployees;
    if (filterStatus === 'actifs') list = list.filter(e => e.is_active);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(e =>
        `${e.nom} ${e.prenom}`.toLowerCase().includes(q) ||
        e.matricule?.toLowerCase().includes(q) ||
        e.poste?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEmployees, filterStatus, searchText]);

  const tk = darkMode ? '#8a98b0' : '#6b7a90';
  const gr = darkMode ? '#2a3448' : '#e8edf3';

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = employees.length;
    const cdi = employees.filter(e => e.type_contrat === 'CDI').length;
    const cdd = employees.filter(e => e.type_contrat === 'CDD').length;
    const consultant = employees.filter(e => e.type_contrat === 'Consultant').length;
    const hommes = employees.filter(e => e.genre === 'M').length;
    const femmes = employees.filter(e => e.genre === 'F').length;
    const actifs = employees.filter(e => e.is_active).length;
    const expires = total - actifs;
    const ages = employees.filter(e => e.age > 0).map(e => e.age);
    const ageMoyen = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    const durations = employees
      .filter(e => e.date_debut && e.date_fin)
      .map(e => {
        const d = new Date(e.date_debut!); const f = new Date(e.date_fin!);
        return (f.getFullYear() - d.getFullYear()) * 12 + (f.getMonth() - d.getMonth());
      });
    return {
      total, cdi, cdd, consultant, hommes, femmes,
      tauxFem: total ? Math.round(femmes * 100 / total) : 0,
      ageMin: ages.length ? Math.min(...ages) : 0,
      ageMax: ages.length ? Math.max(...ages) : 0,
      ageMoyen, actifs, expires,
      tauxRenouvellement: total ? Math.round(expires * 100 / total) : 0,
      ratioPermanentTemp: `${cdi}/${cdd + consultant}`,
      dureeMoy: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    };
  }, [employees]);

  const contratsEcheance = useMemo(() => {
    const today = new Date();
    const d3  = new Date(today.getFullYear(), today.getMonth() + 3,  today.getDate());
    const d6  = new Date(today.getFullYear(), today.getMonth() + 6,  today.getDate());
    const d12 = new Date(today.getFullYear(), today.getMonth() + 12, today.getDate());
    return {
      dans3mois:  employees.filter(e => { if (!e.date_fin || !e.is_active) return false; const f = new Date(e.date_fin); return f <= d3  && f > today; }).length,
      dans6mois:  employees.filter(e => { if (!e.date_fin || !e.is_active) return false; const f = new Date(e.date_fin); return f <= d6  && f > d3;  }).length,
      dans12mois: employees.filter(e => { if (!e.date_fin || !e.is_active) return false; const f = new Date(e.date_fin); return f <= d12 && f > d6;  }).length,
    };
  }, [employees]);

  // ── Chart data ──────────────────────────────────────────────
  const evolutionData = useMemo(() => {
    const today = new Date();
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
      values.push(employees.filter(e => {
        if (!e.date_debut) return false;
        const s = new Date(e.date_debut);
        const f = e.date_fin ? new Date(e.date_fin) : new Date('2099-12-31');
        return s <= d && f >= d;
      }).length);
    }
    return { labels, datasets: [{ label: 'Effectif', data: values, borderColor: '#FF8C00', backgroundColor: 'rgba(255,140,0,0.12)', fill: true, tension: 0.4, pointBackgroundColor: '#FF8C00', pointRadius: 4 }] };
  }, [employees]);

  const regionData = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach(e => { const r = e.region || 'N/A'; map.set(r, (map.get(r) || 0) + 1); });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { labels: sorted.map(([r]) => r), datasets: [{ label: 'Effectif', data: sorted.map(([, n]) => n), backgroundColor: '#FF8C00', borderRadius: 4 }] };
  }, [employees]);

  const genreData = useMemo(() => ({
    labels: ['Hommes', 'Femmes'],
    datasets: [{ data: [stats.hommes, stats.femmes], backgroundColor: ['#3498DB', '#E74C3C'], borderColor: darkMode ? '#1c2333' : '#fff', borderWidth: 3, hoverOffset: 8 }],
  }), [stats, darkMode]);

  const ageData = useMemo(() => {
    const groups: Record<string, number> = { '< 25': 0, '25–34': 0, '35–44': 0, '45–54': 0, '55+': 0 };
    employees.forEach(e => {
      if (!e.age) return;
      if (e.age < 25) groups['< 25']++;
      else if (e.age < 35) groups['25–34']++;
      else if (e.age < 45) groups['35–44']++;
      else if (e.age < 55) groups['45–54']++;
      else groups['55+']++;
    });
    return { labels: Object.keys(groups), datasets: [{ label: 'Employés', data: Object.values(groups), backgroundColor: '#3498DB', borderRadius: 4 }] };
  }, [employees]);

  const contratsTypeData = useMemo(() => ({
    labels: ['CDI', 'CDD', 'Consultant'],
    datasets: [{ data: [stats.cdi, stats.cdd, stats.consultant], backgroundColor: ['#27AE60', '#3498DB', '#9B59B6'], borderColor: darkMode ? '#1c2333' : '#fff', borderWidth: 3, hoverOffset: 8 }],
  }), [stats, darkMode]);

  const embaucheData = useMemo(() => {
    const today = new Date();
    const map = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      map.set(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), 0);
    }
    employees.forEach(e => {
      if (e.date_debut) {
        const k = new Date(e.date_debut).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
      }
    });
    const entries = [...map.entries()];
    return { labels: entries.map(([k]) => k), datasets: [{ label: 'Embauches', data: entries.map(([, v]) => v), backgroundColor: '#27AE60', borderRadius: 4 }] };
  }, [employees]);

  const educData = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach(e => { const d = e.diplome || 'Non spécifié'; map.set(d, (map.get(d) || 0) + 1); });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { labels: sorted.map(([k]) => k), datasets: [{ label: 'Employés', data: sorted.map(([, v]) => v), backgroundColor: '#9B59B6', borderRadius: 4 }] };
  }, [employees]);

  const statutData = useMemo(() => ({
    labels: ['Actifs', 'Expirés'],
    datasets: [{ data: [stats.actifs, stats.expires], backgroundColor: ['#27AE60', '#E74C3C'], borderColor: darkMode ? '#1c2333' : '#fff', borderWidth: 3, hoverOffset: 8 }],
  }), [stats, darkMode]);

  // ── Chart options ───────────────────────────────────────────
  const baseOpts = () => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {} },
    scales: {
      x: { ticks: { color: tk, font: { size: 11 } }, grid: { color: gr } },
      y: { ticks: { color: tk, font: { size: 11 } }, grid: { color: gr } },
    },
  });
  const baseOptsRotated = () => ({
    ...baseOpts(),
    scales: {
      x: { ticks: { color: tk, font: { size: 10 }, maxRotation: 30 }, grid: { color: gr } },
      y: { ticks: { color: tk, font: { size: 11 } }, grid: { color: gr } },
    },
  });
  const donutOpts = (cutout = '68%') => ({
    responsive: true, maintainAspectRatio: false, cutout,
    plugins: { legend: { position: 'bottom' as const, labels: { color: tk, padding: 12, font: { size: 12 } } } },
  });

  // ── Export helpers ──────────────────────────────────────────
  const exportDate = new Date().toISOString().slice(0, 10);
  const filterLabel = [
    filterActeurId ? (acteurs.find(a => a.id === filterActeurId)?.nom ?? filterActeurId) : 'Tous acteurs OF+AF',
    filterProjetId ? (projets.find(p => p.id === filterProjetId)?.nom ?? filterProjetId) : 'Tous projets',
    filterStatus === 'actifs' ? 'Contrats actifs' : 'Tous les employés',
  ].join(' | ');

  const pct = (n: number) => stats.total ? `${Math.round(n * 100 / stats.total)}%` : '0%';

  // Build unified export data from live state
  const buildExportData = () => ({
    filterLabel,
    stats,
    contratsEcheance,
    regions:   regionData.labels.map((l, i) => ({ label: l, effectif: regionData.datasets[0].data[i] as number, pct: Math.round((regionData.datasets[0].data[i] as number) * 100 / (stats.total || 1)) })),
    ages:      ageData.labels.map((l, i)    => ({ tranche: l, nombre: ageData.datasets[0].data[i] as number,    pct: Math.round((ageData.datasets[0].data[i] as number) * 100 / (stats.total || 1)) })),
    embauches: embaucheData.labels.map((l, i) => ({ mois: l, nombre: embaucheData.datasets[0].data[i] as number })),
    education: educData.labels.map((l, i)   => ({ diplome: l, nombre: educData.datasets[0].data[i] as number,   pct: Math.round((educData.datasets[0].data[i] as number) * 100 / (stats.total || 1)) })),
    contrats:  contratsTypeData.labels.map((l, i) => ({ type: l, nombre: contratsTypeData.datasets[0].data[i] as number, pct: Math.round((contratsTypeData.datasets[0].data[i] as number) * 100 / (stats.total || 1)) })),
    employees,
  });

  // Section export helper — builds a styled Excel with stats + employee list
  const secExport = (
    title: string,
    icon: string,
    statsHeaders: string[],
    statsRows: (string | number)[][],
    filteredEmployees: typeof employees,
  ) => {
    exportSectionToExcel({
      title, icon, filterLabel, statsHeaders, statsRows,
      employees: filteredEmployees.map(e => ({
        nom: e.nom, prenom: e.prenom, matricule: e.matricule || '—',
        poste: e.poste, type_contrat: e.type_contrat,
        date_debut: e.date_debut, date_fin: e.date_fin,
        validiteContrat: e.validiteContrat, region: e.region,
        acteur_nom: e.acteur_nom, type_acteur: e.type_acteur,
        genre: e.genre, age: e.age, diplome: e.diplome,
        projets: e.projets,
      })),
    }).catch(console.error);
  };

  const exports = {
    kpi: () => secExport(
      'KPI Généraux', '📊',
      ['Indicateur', 'Valeur', 'Détail'],
      [
        ['Effectif Total',             stats.total,                    'Tous acteurs OF+AF'],
        ['Contrats Actifs',            stats.actifs,                   ''],
        ['Contrats Expirés',           stats.expires,                  ''],
        ['Taux d\'Activation',         pct(stats.actifs),              ''],
        ['Hommes',                     stats.hommes,                   pct(stats.hommes)],
        ['Femmes',                     stats.femmes,                   pct(stats.femmes)],
        ['Taux Féminisation',          `${stats.tauxFem}%`,            ''],
        ['Âge Moyen',                  `${stats.ageMoyen} ans`,        `Min ${stats.ageMin} / Max ${stats.ageMax}`],
        ['CDI',                        stats.cdi,                      pct(stats.cdi)],
        ['CDD',                        stats.cdd,                      pct(stats.cdd)],
        ['Consultant',                 stats.consultant,               pct(stats.consultant)],
        ['Taux Renouvellement',        `${stats.tauxRenouvellement}%`, ''],
        ['Ratio Permanent/Temp',       stats.ratioPermanentTemp,       ''],
        ['Durée Moy. Contrats',        `${stats.dureeMoy} mois`,       ''],
        ['Contrats expirant < 3 mois', contratsEcheance.dans3mois,    'CRITIQUE'],
        ['Contrats expirant < 6 mois', contratsEcheance.dans6mois,    'Attention'],
        ['Contrats expirant < 12 mois',contratsEcheance.dans12mois,   'À surveiller'],
      ],
      employees,
    ),

    region: () => secExport(
      'Effectif par Région', '🗺️',
      ['Région', 'Effectif', '% du Total'],
      regionData.labels.map((l, i) => [l, regionData.datasets[0].data[i] as number, `${Math.round((regionData.datasets[0].data[i] as number) * 100 / (stats.total || 1))}%`]),
      employees, // employees are already region-filtered by parent filters
    ),

    genre: () => {
      secExport(
        'Répartition par Genre', '👥',
        ['Genre', 'Nombre', '% du Total'],
        [['Hommes', stats.hommes, pct(stats.hommes)], ['Femmes', stats.femmes, pct(stats.femmes)]],
        employees,
      );
    },

    age: () => secExport(
      'Pyramide des Âges', '📐',
      ['Tranche d\'Âge', 'Nombre', '% du Total'],
      ageData.labels.map((l, i) => [l, ageData.datasets[0].data[i] as number, `${Math.round((ageData.datasets[0].data[i] as number) * 100 / (stats.total || 1))}%`]),
      employees,
    ),

    contrats: () => secExport(
      'Types de Contrats', '📋',
      ['Type de Contrat', 'Nombre', '% du Total'],
      contratsTypeData.labels.map((l, i) => [l, contratsTypeData.datasets[0].data[i] as number, `${Math.round((contratsTypeData.datasets[0].data[i] as number) * 100 / (stats.total || 1))}%`]),
      employees,
    ),

    embauches: () => secExport(
      'Embauches Mensuelles', '📅',
      ['Mois', "Nombre d'Embauches"],
      embaucheData.labels.map((l, i) => [l, embaucheData.datasets[0].data[i] as number]),
      employees,
    ),

    education: () => secExport(
      "Niveau d'Éducation", '🎓',
      ['Diplôme / Niveau', 'Nombre', '% du Total'],
      educData.labels.map((l, i) => [l, educData.datasets[0].data[i] as number, `${Math.round((educData.datasets[0].data[i] as number) * 100 / (stats.total || 1))}%`]),
      employees,
    ),

    // ── Full exports ──────────────────────────────────────────
    excel: () => exportToExcel(buildExportData()).catch(console.error),
    pptx:  () => exportToPowerPoint(buildExportData()).catch(console.error),
  };

  const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const kpiCards = [
    { label: 'Effectif Total',      value: stats.total,             icon: Users,        color: '#FF8C00', bg: 'rgba(255,140,0,0.1)',    sub: 'Tous acteurs OF+AF' },
    { label: 'Contrats Actifs',     value: stats.actifs,            icon: CheckCircle,  color: '#27AE60', bg: 'rgba(39,174,96,0.1)',    sub: 'En cours' },
    { label: 'Taux Féminisation',   value: `${stats.tauxFem}%`,     icon: TrendingUp,   color: '#3498DB', bg: 'rgba(52,152,219,0.1)',   sub: `${stats.femmes} femmes` },
    { label: 'Âge Moyen',          value: `${stats.ageMoyen} ans`, icon: Clock,        color: '#9B59B6', bg: 'rgba(155,89,182,0.1)',   sub: `Min ${stats.ageMin} · Max ${stats.ageMax}` },
  ];

  // Export dropdown items (each section = stats + employee list in styled Excel)
  const exportItems = [
    { label: '📊 KPI Généraux',          fn: exports.kpi },
    { label: '🗺️ Effectif par Région',   fn: exports.region },
    { label: '👥 Genre',                  fn: exports.genre },
    { label: '📐 Pyramide des Âges',      fn: exports.age },
    { label: '📋 Types de Contrats',      fn: exports.contrats },
    { label: '📅 Embauches Mensuelles',   fn: exports.embauches },
    { label: "🎓 Niveau d'Éducation",     fn: exports.education },
  ];

  return (
    <div className={`rd-container ${darkMode ? 'dark' : ''}`}>
      <main className="rd-main">

        {/* ── Report toast ────────────────────────────────────── */}
        {reportToast && (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
            background: reportToast.type === 'success' ? '#27AE60' : '#E74C3C',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}>
            {reportToast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {reportToast.msg}
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="rd-header">
          <div className="rd-header-left">
            <h1 className="rd-title">Tableau de Bord — Vue Responsable</h1>
            <p className="rd-subtitle">{todayStr}</p>
          </div>
          <div className="rd-header-right">
            {/* Export dropdown */}
            <div className="rd-export-wrap" ref={exportRef}>
              <button className="rd-export-btn" onClick={() => setExportOpen(v => !v)}>
                <Download size={15} />
                Exporter
                <ChevronDown size={13} style={{ marginLeft: 2, transform: exportOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {exportOpen && (
                <div className="rd-export-dropdown">
                  <div className="rd-export-meta-block">
                    <p className="rd-export-meta-title">Exporter une section</p>
                    <p className="rd-export-meta-sub">Chaque export inclut les statistiques + la liste des employés filtrée</p>
                    <p className="rd-export-meta-filters">{filterLabel}</p>
                  </div>
                  <div className="rd-export-list">
                    {exportItems.map(item => (
                      <button key={item.label} className="rd-export-item" onClick={() => { item.fn(); setExportOpen(false); }}>
                        <FileSpreadsheet size={12} />
                        <span className="rd-export-item-label">{item.label}</span>
                        <span className="rd-export-item-badge">xlsx</span>
                      </button>
                    ))}
                  </div>
                  <div className="rd-export-divider" />
                  <p className="rd-export-meta-title" style={{ marginBottom: 6 }}>Export complet</p>
                  <button className="rd-export-all rd-export-excel" onClick={() => { exports.excel(); setExportOpen(false); }}>
                    <FileSpreadsheet size={14} />
                    <span>Tout — Excel multi-feuilles (.xlsx)</span>
                    <span className="rd-export-item-badge" style={{ background: '#27AE60' }}>9 feuilles</span>
                  </button>
                  <button className="rd-export-all rd-export-pptx" onClick={() => { exports.pptx(); setExportOpen(false); }}>
                    <Presentation size={14} />
                    <span>Tout — PowerPoint (.pptx)</span>
                    <span className="rd-export-item-badge" style={{ background: '#C0392B' }}>10 slides</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleSendReport}
              disabled={sendingReport}
              title="Envoyer le rapport par email maintenant"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: sendingReport ? '#ccc' : 'linear-gradient(135deg, #27AE60, #1e9952)',
                color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                cursor: sendingReport ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(39,174,96,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {sendingReport
                ? <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <Send size={14} />
              }
              {sendingReport ? 'Envoi…' : 'Envoyer rapport'}
            </button>
            <button className="rd-dark-btn" onClick={toggleDarkMode} title="Basculer le thème">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* ── Filters bar ────────────────────────────────────── */}
        <section className="rd-filters-bar">
          <div className="rd-filter-group">
            <Filter size={15} />
            <select className="rd-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'tous' | 'actifs')}>
              <option value="tous">Tous les employés</option>
              <option value="actifs">Contrats actifs</option>
            </select>
          </div>
          <div className="rd-filter-group">
            <Building2 size={15} />
            <select className="rd-filter-select" value={filterActeurId} onChange={e => setFilterActeurId(e.target.value)}>
              <option value="">Tous les acteurs (OF+AF)</option>
              {acteurs.map(a => <option key={a.id} value={a.id}>[{a.type_acteur}] {a.nom}</option>)}
            </select>
          </div>
          <div className="rd-filter-group">
            <Briefcase size={15} />
            <select className="rd-filter-select" value={filterProjetId} onChange={e => setFilterProjetId(e.target.value)}>
              <option value="">Tous les projets</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </div>
          <div className="rd-filter-group rd-filter-search">
            <Search size={15} />
            <input className="rd-filter-input" placeholder="Rechercher un employé..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
        </section>

        {/* ── KPI Cards ──────────────────────────────────────── */}
        <section className="rd-kpi-grid">
          {kpiCards.map((k, i) => (
            <div key={i} className="rd-kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
              <div className="rd-kpi-icon" style={{ background: k.bg, color: k.color }}><k.icon size={22} /></div>
              <div className="rd-kpi-body">
                <p className="rd-kpi-label">{k.label}</p>
                <p className="rd-kpi-value">{loading ? '—' : k.value}</p>
                <p className="rd-kpi-sub">{k.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Charts Grid ────────────────────────────────────── */}
        <section className="rd-charts-grid">

          {/* Évolution effectifs */}
          <div className="rd-chart-card rd-span-2">
            <div className="rd-chart-header">
              <TrendingUp size={18} className="rd-chart-icon" />
              <h3>Évolution des Effectifs (12 mois)</h3>
              <button className="rd-card-dl" onClick={exports.embauches} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 260 }}>
              <Line data={evolutionData} options={baseOpts()} />
            </div>
          </div>

          {/* Effectif par région */}
          <div className="rd-chart-card rd-span-2">
            <div className="rd-chart-header">
              <MapPin size={18} className="rd-chart-icon" />
              <h3>Effectif par Région</h3>
              <button className="rd-card-dl" onClick={exports.region} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 260 }}>
              <Bar data={regionData} options={baseOptsRotated()} />
            </div>
          </div>

          {/* Genre */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <Users size={18} className="rd-chart-icon" />
              <h3>Répartition par Genre</h3>
              <button className="rd-card-dl" onClick={exports.genre} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 200 }}>
              <Doughnut data={genreData} options={donutOpts()} />
            </div>
            <div className="rd-donut-numbers">
              <div><span style={{ color: '#3498DB', fontWeight: 700, fontSize: '1.5rem' }}>{stats.hommes}</span><br /><small style={{ color: tk }}>Hommes</small></div>
              <div style={{ textAlign: 'center' }}><span style={{ color: darkMode ? '#e8edf3' : '#1f2d3d', fontWeight: 700, fontSize: '1.8rem' }}>{stats.total}</span><br /><small style={{ color: tk }}>Total</small></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#E74C3C', fontWeight: 700, fontSize: '1.5rem' }}>{stats.femmes}</span><br /><small style={{ color: tk }}>Femmes</small></div>
            </div>
          </div>

          {/* Pyramide des âges */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <BarChart3 size={18} className="rd-chart-icon" />
              <h3>Pyramide des Âges</h3>
              <button className="rd-card-dl" onClick={exports.age} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 220 }}>
              <Bar data={ageData} options={baseOpts()} />
            </div>
          </div>

          {/* Types de contrats */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <Briefcase size={18} className="rd-chart-icon" />
              <h3>Types de Contrats</h3>
              <button className="rd-card-dl" onClick={exports.contrats} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 200 }}>
              <Doughnut data={contratsTypeData} options={donutOpts()} />
            </div>
            <div className="rd-donut-numbers">
              <div><span style={{ color: '#27AE60', fontWeight: 700, fontSize: '1.4rem' }}>{stats.cdi}</span><br /><small style={{ color: tk }}>CDI</small></div>
              <div style={{ textAlign: 'center' }}><span style={{ color: '#3498DB', fontWeight: 700, fontSize: '1.4rem' }}>{stats.cdd}</span><br /><small style={{ color: tk }}>CDD</small></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#9B59B6', fontWeight: 700, fontSize: '1.4rem' }}>{stats.consultant}</span><br /><small style={{ color: tk }}>Consult.</small></div>
            </div>
          </div>

          {/* Embauches mensuelles */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <Calendar size={18} className="rd-chart-icon" />
              <h3>Embauches Mensuelles</h3>
              <button className="rd-card-dl" onClick={exports.embauches} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 220 }}>
              <Bar data={embaucheData} options={baseOptsRotated()} />
            </div>
          </div>

          {/* Niveau d'éducation */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <GraduationCap size={18} className="rd-chart-icon" />
              <h3>Niveau d'Éducation</h3>
              <button className="rd-card-dl" onClick={exports.education} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 220 }}>
              <Bar data={educData} options={{
                indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: tk, font: { size: 11 } }, grid: { color: gr } },
                  y: { ticks: { color: tk, font: { size: 10 } }, grid: { color: gr } },
                },
              }} />
            </div>
          </div>

          {/* Statut contrats + Alertes */}
          <div className="rd-chart-card">
            <div className="rd-chart-header">
              <ClipboardList size={18} className="rd-chart-icon" />
              <h3>Statut des Contrats</h3>
              <button className="rd-card-dl" onClick={exports.kpi} title="Exporter"><Download size={12} /></button>
            </div>
            <div style={{ position: 'relative', height: 150 }}>
              <Doughnut data={statutData} options={{ ...donutOpts('60%'), plugins: { legend: { position: 'bottom', labels: { color: tk, padding: 8, font: { size: 11 } } } } }} />
            </div>
            <div className="rd-donut-numbers" style={{ marginBottom: 8 }}>
              <div><span style={{ color: '#27AE60', fontWeight: 700, fontSize: '1.4rem' }}>{stats.actifs}</span><br /><small style={{ color: tk }}>Actifs</small></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: '#E74C3C', fontWeight: 700, fontSize: '1.4rem' }}>{stats.expires}</span><br /><small style={{ color: tk }}>Expirés</small></div>
            </div>
            <div className="rd-chart-header" style={{ marginTop: 12 }}>
              <AlertTriangle size={18} style={{ color: '#F39C12', flexShrink: 0 }} />
              <h3>Contrats à Échéance</h3>
            </div>
            <div className="rd-alert-grid">
              <div className="rd-alert-item rd-alert-danger">
                <AlertCircle size={16} />
                <div><p className="rd-alert-count">{loading ? '—' : contratsEcheance.dans3mois}</p><p className="rd-alert-label">Dans 3 mois</p></div>
              </div>
              <div className="rd-alert-item rd-alert-warning">
                <Clock size={16} />
                <div><p className="rd-alert-count">{loading ? '—' : contratsEcheance.dans6mois}</p><p className="rd-alert-label">Dans 6 mois</p></div>
              </div>
              <div className="rd-alert-item rd-alert-info">
                <Calendar size={16} />
                <div><p className="rd-alert-count">{loading ? '—' : contratsEcheance.dans12mois}</p><p className="rd-alert-label">Dans 12 mois</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Indicateurs RH ─────────────────────────────────── */}
        <section className="rd-section">
          <div className="rd-section-header">
            <Building2 size={18} className="rd-chart-icon" />
            <h2>Indicateurs RH</h2>
            <button className="rd-card-dl" style={{ marginLeft: 'auto' }} onClick={exports.kpi} title="Exporter KPI"><Download size={12} /></button>
          </div>
          <div className="rd-info-grid">
            {[
              { label: 'CDI',                   value: stats.cdi,                        icon: CheckCircle, color: '#27AE60' },
              { label: 'CDD',                   value: stats.cdd,                        icon: Briefcase,   color: '#3498DB' },
              { label: 'Consultant',            value: stats.consultant,                  icon: Users,       color: '#9B59B6' },
              { label: 'Taux de Renouvellement',value: `${stats.tauxRenouvellement}%`,   icon: TrendingUp,  color: '#F39C12' },
              { label: 'Ratio Permanent/Temp.', value: stats.ratioPermanentTemp,          icon: BarChart3,   color: '#FF8C00' },
              { label: 'Durée Moy. Contrats',   value: `${stats.dureeMoy} mois`,         icon: Clock,       color: '#E74C3C' },
            ].map((item, i) => (
              <div key={i} className="rd-info-card">
                <div className="rd-info-icon" style={{ color: item.color }}><item.icon size={20} /></div>
                <div>
                  <p className="rd-info-label">{item.label}</p>
                  <p className="rd-info-value">{loading ? '—' : item.value ?? '--'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
