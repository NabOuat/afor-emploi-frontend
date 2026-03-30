import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService, { type LoginRequest, type User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  actorType: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérification initiale : session valide dans cet onglet ?
    if (authService.isAuthenticated()) {
      const storedUser = authService.getUser();
      if (storedUser) setUser(storedUser);
    }
    setIsLoading(false);

    // Écouter la réponse d'un autre onglet qui partage sa session
    const onRestored = () => {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
          setIsLoading(false);
        }
      }
    };

    // Écouter la déconnexion d'un autre onglet
    const onLogout = () => {
      setUser(null);
      setError(null);
    };

    window.addEventListener('session_restored', onRestored);
    window.addEventListener('session_logout', onLogout);
    return () => {
      window.removeEventListener('session_restored', onRestored);
      window.removeEventListener('session_logout', onLogout);
    };
  }, []);

  // Vérification auto de l'expiration toutes les minutes + renouvellement sur activité
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (!authService.isAuthenticated()) {
        setUser(null);
        setError(null);
      }
    }, 60_000);

    const onActivity = () => authService.refreshExpiry();
    window.addEventListener('click', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, [user]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(credentials);
      const userData = authService.getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    actorType: user?.actor_type || sessionStorage.getItem('actor_type') || null,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
