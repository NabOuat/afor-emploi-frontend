/**
 * Utilitaire pour normaliser les textes saisis
 * Convertit en minuscules, supprime les accents, met en majuscule la première lettre
 */

export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('')
    .map((char, index) => index === 0 ? char.toUpperCase() : char)
    .join('');
};
