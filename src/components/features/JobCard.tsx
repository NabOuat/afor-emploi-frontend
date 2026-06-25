import type { Job } from '../../types';
import './JobCard.css';

interface JobCardProps {
  job: Job;
  onApply?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
}

export function JobCard({ job, onApply, onViewDetails }: JobCardProps) {
  return (
    <div className="job-card">
      <div className="job-card-header">
        {job.companyLogo && (
          <img src={job.companyLogo} alt={job.company} className="company-logo" />
        )}
        <div className="job-title-section">
          <h3 className="job-title">{job.title}</h3>
          <p className="company-name">{job.company}</p>
        </div>
      </div>

      <div className="job-card-body">
        <div className="job-meta">
          <span className="location">📍 {job.location}</span>
          <span className={`job-type job-type-${job.jobType.toLowerCase()}`}>
            {job.jobType}
          </span>
        </div>

        <p className="job-description">{job.description}</p>

        <div className="job-skills">
          {job.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="skill-tag">{skill}</span>
          ))}
          {job.skills.length > 3 && (
            <span className="skill-tag more">+{job.skills.length - 3}</span>
          )}
        </div>

        <div className="job-footer">
          <div className="job-info">
            {job.salary && (
              <span className="salary">
                {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()} {job.salary.currency}
              </span>
            )}
            <span className="experience">{job.experience}</span>
          </div>
          <span className="posted-date">{job.postedDate}</span>
        </div>
      </div>

      <div className="job-card-actions">
        <button 
          className="btn-secondary"
          onClick={() => onViewDetails?.(job.id)}
        >
          Voir détails
        </button>
        <button 
          className="btn-primary"
          onClick={() => onApply?.(job.id)}
        >
          Postuler
        </button>
      </div>
    </div>
  );
}
