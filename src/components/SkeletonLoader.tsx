import '../styles/SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'card' | 'table-row' | 'chart' | 'text';
  count?: number;
}

export default function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className="skeleton-container">
        {skeletons.map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-header"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table-row') {
    return (
      <div className="skeleton-table">
        {skeletons.map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="skeleton-chart">
        <div className="skeleton-chart-bar"></div>
        <div className="skeleton-chart-bar"></div>
        <div className="skeleton-chart-bar"></div>
        <div className="skeleton-chart-bar"></div>
      </div>
    );
  }

  return (
    <div className="skeleton-text">
      {skeletons.map(i => (
        <div key={i} className="skeleton-line"></div>
      ))}
    </div>
  );
}
