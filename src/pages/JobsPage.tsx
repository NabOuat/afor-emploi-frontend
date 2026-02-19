import { useState, useEffect } from 'react';
import type { Job, SearchFilters } from '../types';
import { jobAPI } from '../services/api';
import '../styles/JobsPage.css';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobAPI.getJobs(filters);
      setJobs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleApply = async (jobId: string) => {
    try {
      alert('Candidature envoyée avec succès !');
    } catch (err) {
      alert('Erreur lors de la candidature');
    }
  };

  return (
    <div className="jobs-page">
      <div className="jobs-container">
        <aside className="filters-sidebar">
          <h3>Filtres</h3>
          <div className="filter-group">
            <label>Mot-clé</label>
            <input
              type="text"
              placeholder="Poste ou entreprise"
              onChange={(e) => handleSearch({ ...filters, keyword: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>Localisation</label>
            <input
              type="text"
              placeholder="Ville ou région"
              onChange={(e) => handleSearch({ ...filters, location: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>Type de contrat</label>
            <div className="checkbox-group">
              {['CDI', 'CDD', 'Stage', 'Freelance'].map(type => (
                <label key={type}>
                  <input type="checkbox" />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Salaire minimum</label>
            <input type="number" placeholder="0" />
          </div>
        </aside>

        <main className="jobs-list">
          {loading && <p className="loading">Chargement des offres...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && jobs.length === 0 && <p className="no-jobs">Aucune offre trouvée</p>}

          {jobs.map(job => (
            <div key={job.id} className="job-item">
              <div className="job-header">
                {job.companyLogo && <img src={job.companyLogo} alt={job.company} className="company-logo" />}
                <div className="job-info">
                  <h3>{job.title}</h3>
                  <p className="company">{job.company}</p>
                </div>
              </div>

              <div className="job-details">
                <span className="location">📍 {job.location}</span>
                <span className={`job-type ${job.jobType.toLowerCase()}`}>{job.jobType}</span>
                {job.salary && (
                  <span className="salary">
                    {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
                  </span>
                )}
              </div>

              <p className="description">{job.description}</p>

              <div className="skills">
                {job.skills.slice(0, 4).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>

              <div className="job-footer">
                <span className="posted-date">{job.postedDate}</span>
                <button className="apply-btn" onClick={() => handleApply(job.id)}>
                  Postuler
                </button>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
