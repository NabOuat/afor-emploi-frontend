import { useState, useEffect } from 'react';

/**
 * Hook partagé pour le mode sombre.
 * - Initialise depuis localStorage
 * - Applique la classe `dark-mode` sur <html>
 * - Utilise MutationObserver pour synchroniser TOUS les composants
 *   quand n'importe lequel d'entre eux change le thème (Sidebar, dashboard, etc.)
 */
export function useDarkMode(): [boolean, () => void] {
  const [darkMode, setDarkMode] = useState<boolean>(
    () => localStorage.getItem('darkMode') === 'true'
  );

  useEffect(() => {
    // Applique l'état initial
    document.documentElement.classList.toggle('dark-mode', localStorage.getItem('darkMode') === 'true');

    // Écoute tous les changements de classe sur <html>
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains('dark-mode'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark-mode');
    document.documentElement.classList.toggle('dark-mode', next);
    localStorage.setItem('darkMode', String(next));
    // Le MutationObserver déclenche setDarkMode automatiquement
  };

  return [darkMode, toggle];
}
