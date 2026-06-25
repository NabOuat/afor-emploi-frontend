export function getDashboardPath(actorType: string | null): string {
  switch ((actorType || '').toUpperCase()) {
    case 'AF':    return '/afor/dashboard';
    case 'OF':    return '/operator/dashboard';
    case 'AD':    return '/admin/dashboard';
    case 'RESPO': return '/responsable/dashboard';
    default:      return '/dashboard';
  }
}
