import { useState, useEffect } from 'react';
import type { Application } from '../types';
import { applicationAPI } from '../services/api';
import '../styles/ApplicationsPage.css';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'interview'>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await applicationAPI.getUserApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      rejected: 'Rejetée',
      interview: 'Entretien prévu',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-${status}`;
  };

  return (
    <div className="applications-page">
      <div className="applications-container">
        <h1>Mes candidatures</h1>

        <div className="filter-tabs">
          {['all', 'pending', 'accepted', 'rejected', 'interview'].map(tab => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab as typeof filter)}
            >
              {tab === 'all' ? 'Toutes' : getStatusLabel(tab)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="loading">Chargement de vos candidatures...</p>
        ) : filteredApplications.length === 0 ? (
          <p className="no-applications">
            {filter === 'all'
              ? 'Vous n\'avez pas encore posé de candidature'
              : `Aucune candidature ${getStatusLabel(filter).toLowerCase()}`}
          </p>
        ) : (
          <div className="applications-list">
            {filteredApplications.map(app => (
              <div key={app.id} className="application-card">
                <div className="application-header">
                  <h3>Candidature #{app.id.slice(0, 8)}</h3>
                  <span className={`status-badge ${getStatusClass(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>

                <div className="application-details">
                  <p><strong>Offre d'emploi :</strong> {app.jobId}</p>
                  <p><strong>Date de candidature :</strong> {new Date(app.appliedDate).toLocaleDateString('fr-FR')}</p>
                  {app.message && (
                    <p><strong>Message :</strong> {app.message}</p>
                  )}
                </div>

                <div className="application-actions">
                  <button className="btn-secondary">Voir l'offre</button>
                  <button className="btn-secondary">Retirer ma candidature</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
