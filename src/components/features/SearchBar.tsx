import { useState } from 'react';
import type { SearchFilters } from '../../types';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword: keyword || undefined,
      location: location || undefined,
      jobType: jobType.length > 0 ? jobType : undefined,
    });
  };

  const toggleJobType = (type: string) => {
    setJobType(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-inputs">
          <div className="input-group">
            <label htmlFor="keyword">Poste ou entreprise</label>
            <input
              id="keyword"
              type="text"
              placeholder="Ex: Développeur, Designer..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="location">Localisation</label>
            <input
              id="location"
              type="text"
              placeholder="Ex: Paris, Lyon..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="job-type-filters">
          <label>Type de contrat</label>
          <div className="checkbox-group">
            {['CDI', 'CDD', 'Stage', 'Freelance'].map(type => (
              <label key={type} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={jobType.includes(type)}
                  onChange={() => toggleJobType(type)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="search-btn">
          Rechercher
        </button>
      </form>
    </div>
  );
}
