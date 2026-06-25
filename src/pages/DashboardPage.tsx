import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_ROUTES: Record<string, string> = {
  AD:    '/admin/dashboard',
  AF:    '/afor/dashboard',
  OF:    '/operator/dashboard',
  RESPO: '/responsable/dashboard',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { actorType } = useAuth();

  useEffect(() => {
    const destination = ROLE_ROUTES[actorType || ''] ?? '/login';
    navigate(destination, { replace: true });
  }, [navigate, actorType]);

  return null;
}
