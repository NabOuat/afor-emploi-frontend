/**
 * Utilitaire pour gérer l'affichage des engagements selon le type d'acteur
 */

export type ActorType = 'Acteur' | 'OF' | 'Organisme de Formation' | string;

/**
 * Détermine si les engagements doivent être affichés pour un type d'acteur
 * @param actorType Type d'acteur (Acteur, OF, etc.)
 * @returns true si les engagements doivent être affichés, false sinon
 */
export const shouldShowEngagements = (actorType: string | null | undefined): boolean => {
  if (!actorType) return true; // Par défaut, afficher les engagements
  
  const normalizedType = actorType.toLowerCase().trim();
  
  // Les OF (Organismes de Formation) n'affichent pas les engagements
  const noEngagementTypes = ['of', 'organisme de formation', 'formation'];
  
  return !noEngagementTypes.some(type => normalizedType.includes(type));
};

/**
 * Récupère le type d'acteur depuis localStorage
 * @returns Type d'acteur ou null
 */
export const getActorTypeFromStorage = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.actor_type || null;
    }
  } catch (err) {
    console.error('Erreur lors de la lecture du type d\'acteur:', err);
  }
  return null;
};

/**
 * Détermine si les engagements doivent être affichés (utilise localStorage)
 * @returns true si les engagements doivent être affichés
 */
export const shouldShowEngagementsFromStorage = (): boolean => {
  const actorType = getActorTypeFromStorage();
  return shouldShowEngagements(actorType);
};
