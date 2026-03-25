import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import '../../styles/ActorsManagement.css';

interface Actor {
  id: number;
  name: string;
  type: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  employees: number;
  joinDate: string;
}

export default function ActorsManagement() {
  const [actors, setActors] = useState<Actor[]>([
    { id: 1, name: 'Opérateur A', type: 'Opérateur', email: 'operator@example.com', phone: '+226 70 00 00 00', location: 'Ouagadougou', status: 'Actif', employees: 45, joinDate: '2023-01-15' },
    { id: 2, name: 'École Polytechnique', type: 'École', email: 'ecole@example.com', phone: '+226 70 11 11 11', location: 'Bobo-Dioulasso', status: 'Actif', employees: 120, joinDate: '2023-03-20' },
    { id: 3, name: 'Agence Foncière', type: 'Agence', email: 'agence@example.com', phone: '+226 70 22 22 22', location: 'Koudougou', status: 'Inactif', employees: 30, joinDate: '2023-06-10' },
    { id: 4, name: 'Opérateur B', type: 'Opérateur', email: 'operator2@example.com', phone: '+226 70 33 33 33', location: 'Ouagadougou', status: 'Actif', employees: 67, joinDate: '2023-08-05' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  const filteredActors = actors.filter(actor => {
    const matchesSearch = actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         actor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || actor.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className={`actors-management ${darkMode ? 'dark-mode' : ''}`}>
      <div className="actors-header">
        <h1>Gestion des Acteurs</h1>
        <p>Gérez les opérateurs, écoles et agences</p>
      </div>

      <div className="actors-container">
        <div className="actors-controls">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher un acteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les types</option>
            <option value="Opérateur">Opérateur</option>
            <option value="École">École</option>
            <option value="Agence">Agence</option>
          </select>

          <button className="btn-add">
            <Plus size={18} />
            Ajouter un acteur
          </button>
        </div>

        <div className="actors-table-wrapper">
          <table className="actors-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Localisation</th>
                <th>Statut</th>
                <th>Employés</th>
                <th>Date d'adhésion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActors.map(actor => (
                <tr key={actor.id}>
                  <td className="actor-name">{actor.name}</td>
                  <td>
                    <span className={`badge badge-${actor.type.toLowerCase()}`}>
                      {actor.type}
                    </span>
                  </td>
                  <td>{actor.email}</td>
                  <td>{actor.phone}</td>
                  <td>{actor.location}</td>
                  <td>
                    <span className={`status ${actor.status.toLowerCase()}`}>
                      {actor.status}
                    </span>
                  </td>
                  <td className="text-center">{actor.employees}</td>
                  <td>{new Date(actor.joinDate).toLocaleDateString('fr-FR')}</td>
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

        <div className="actors-footer">
          <p>Total: {filteredActors.length} acteur(s)</p>
        </div>
      </div>
    </div>
  );
}
