import React from 'react';
import '../../styles/dashboard/FilterBar.css';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  options: FilterOption[];
  loading?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedFilter,
  onFilterChange,
  options,
  loading = false,
}) => {
  return (
    <div className="filter-bar">
      <select
        value={selectedFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="filter-select"
        disabled={loading}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {loading && <div className="filter-loader" />}
    </div>
  );
};

export default FilterBar;
