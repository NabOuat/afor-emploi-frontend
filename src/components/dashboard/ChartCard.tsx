import React from 'react';
import '../../styles/dashboard/ChartCard.css';

export interface ChartItem {
  label: string;
  value: number;
  percentage: number;
  color?: string;
}

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  data: ChartItem[];
  loading?: boolean;
  colors?: string[];
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  icon,
  data,
  loading = false,
  colors = ['#FF8C00', '#3498DB', '#27AE60', '#E74C3C', '#9B59B6'],
}) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>{title}</h3>
        {icon}
      </div>
      <div className="chart-content">
        {loading ? (
          <div className="chart-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-bar" />
            ))}
          </div>
        ) : (
          data.map((item, index) => (
            <div key={index} className="chart-item">
              <div className="chart-label">
                <span>{item.label}</span>
                <span className="chart-value">{item.value}</span>
              </div>
              <div className="chart-bar">
                <div
                  className="chart-fill"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color || colors[index % colors.length],
                  }}
                />
              </div>
              <span className="chart-percentage">{item.percentage}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChartCard;
