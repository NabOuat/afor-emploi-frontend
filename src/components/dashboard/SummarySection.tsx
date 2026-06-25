import React from 'react';
import '../../styles/dashboard/SummarySection.css';

export interface SummaryItem {
  label: string;
  value: string | number;
}

interface SummarySectionProps {
  title: string;
  items: SummaryItem[];
  loading?: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  title,
  items,
  loading = false,
}) => {
  return (
    <div className="summary-section">
      <h2>{title}</h2>
      <div className="summary-grid">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="summary-item skeleton">
              <span className="skeleton-text" />
              <span className="skeleton-value" />
            </div>
          ))
        ) : (
          items.map((item, index) => (
            <div key={index} className="summary-item">
              <span className="summary-label">{item.label}</span>
              <span className="summary-value">{item.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SummarySection;
