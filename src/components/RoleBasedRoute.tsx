import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, actorType } = useAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (location.pathname === '/dashboard' && actorType) {
      setShouldRedirect(true);
    }
  }, [location.pathname, actorType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!actorType) {
    return <Navigate to="/login" replace />;
  }

  const getDashboardPath = (type: string): string => {
    const typeUpper = type?.toUpperCase() || '';
    switch (typeUpper) {
      case 'OF':
        return '/operator/dashboard';
      case 'AF':
        return '/afor/dashboard';
      case 'RESPO':
        return '/responsable/dashboard';
      case 'AD':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  if (shouldRedirect) {
    const dashboardPath = getDashboardPath(actorType);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
