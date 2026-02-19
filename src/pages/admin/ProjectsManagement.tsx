import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import '../../styles/ProjectsManagement.css';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  responsible: string;
  progress: number;
  region: string;
}

export default function ProjectsManagement() {
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: 'Projet Emploi Rural', description: 'Création d\'emplois en zone rurale', status: 'En cours', budget: 50000000, startDate: '2023-01-15', endDate: '2024-12-31', responsible: 'Opérateur A', progress: 65, region: 'Cascades' },
    { id: 2, name: 'Formation Agricole', description: 'Formation des jeunes agriculteurs', status: 'Planifié', budget: 30000000, startDate: '2024-02-01', endDate: '2025-06-30', responsible: 'École Polytechnique', progress: 0, region: 'Hauts-Bassins' },
    { id: 3, name: 'Infrastructure Locale', description: 'Construction d\'infrastructures', status: 'En cours', budget: 75000000, startDate: '2023-06-10', endDate: '2025-03-31', responsible: 'Agence Foncière', progress: 45, region: 'Centre' },
    { id: 4, name: 'Digitalisation', description: 'Numérisation des processus', status: 'Terminé', budget: 20000000, startDate: '2022-09-01', endDate: '2023-12-31', responsible: 'Opérateur B', progress: 100, region: 'Ouagadougou' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'En cours': return 'in-progress';
      case 'Planifié': return 'planned';
      case 'Terminé': return 'completed';
      default: return 'default';
    }
  };

  return (
    <>
      <AdminHeader />
      <div className={`projects-management ${darkMode ? 'dark-mode' : ''}`}>
        <div className="projects-header">
          <h1>Gestion des Projets</h1>
          <p>Suivez et gérez tous les projets en cours</p>
        </div>

        <div className="projects-container">
          <div className="projects-controls">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="Planifié">Planifié</option>
              <option value="Terminé">Terminé</option>
            </select>

            <button className="btn-add">
              <Plus size={18} />
              Ajouter un projet
            </button>
          </div>

          <div className="projects-table-wrapper">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Nom du Projet</th>
                  <th>Description</th>
                  <th>Statut</th>
                  <th>Budget (FCFA)</th>
                  <th>Responsable</th>
                  <th>Région</th>
                  <th>Progression</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td className="project-name">{project.name}</td>
                    <td className="project-desc">{project.description}</td>
                    <td>
                      <span className={`status ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="budget">{(project.budget / 1000000).toFixed(1)}M</td>
                    <td>{project.responsible}</td>
                    <td>{project.region}</td>
                    <td>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                        <span className="progress-text">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="dates">
                      <small>{new Date(project.startDate).toLocaleDateString('fr-FR')} - {new Date(project.endDate).toLocaleDateString('fr-FR')}</small>
                    </td>
                    <td className="actions-cell">
                      <button className="btn-action view" title="Voir">
                        <Eye size={16} />
                      </button>
                      <button className="btn-action edit" title="Modifier">
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-action delete" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="projects-footer">
            <p>Total: {filteredProjects.length} projet(s)</p>
          </div>
        </div>
      </div>
    </>
  );
}
