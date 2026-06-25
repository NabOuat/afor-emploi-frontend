import React from 'react';
import '../../styles/dashboard/StatCard.css';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  unit?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  unit,
  loading = false,
}) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-header">
        <div className="stat-icon" style={{ color }}>
          {loading ? <div className="skeleton-icon" /> : icon}
        </div>
        <div className="stat-info">
          <h3>{title}</h3>
          {trend && (
            <span className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% ce mois
            </span>
          )}
        </div>
      </div>
      <div className="stat-value">
        {loading ? <div className="skeleton-value" /> : `${value}${unit ? ` ${unit}` : ''}`}
      </div>
    </div>
  );
};

export default StatCard;
