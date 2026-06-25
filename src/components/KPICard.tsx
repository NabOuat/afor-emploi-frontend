import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import '../styles/KPICard.css';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: 'orange' | 'blue' | 'green' | 'red' | 'purple';
  onClick?: () => void;
}

const KPICard = memo(({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'orange',
  onClick,
}: KPICardProps) => {
  const isTrendPositive = trend && trend > 0;

  return (
    <div className={`kpi-card kpi-${color}`} onClick={onClick}>
      <div className="kpi-header">
        <h3 className="kpi-title">{title}</h3>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>

      <div className="kpi-content">
        <div className="kpi-value">
          {value}
          {unit && <span className="kpi-unit">{unit}</span>}
        </div>

        {trend !== undefined && (
          <div className={`kpi-trend ${isTrendPositive ? 'positive' : 'negative'}`}>
            {isTrendPositive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

export default KPICard;
