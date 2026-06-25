const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Durée de session : 2 heures (en millisecondes)
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  username: string;
  actor_type?: string | null;
  acteur_id?: string | null;
}

export interface User {
  id: string;
  username: string;
  nom?: string;
  prenom?: string;
  email?: string;
  acteur_id: string;
  actor_type?: string;
}

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';
  private acteurKey = 'acteur_id';
  private expiryKey = 'session_expiry';

  private _clearStorage(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.acteurKey);
    sessionStorage.removeItem(this.expiryKey);
    sessionStorage.removeItem('actor_type');
  }

  logout(): void {
    this._clearStorage();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: credentials.username, password: credentials.password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    const expiry = Date.now() + SESSION_DURATION_MS;

    // sessionStorage : effacé automatiquement à la fermeture du navigateur
    sessionStorage.setItem(this.tokenKey, data.access_token);
    sessionStorage.setItem(this.userKey, JSON.stringify({
      username: data.username,
      nom: null,
      prenom: null,
      actor_type: data.actor_type || null,
      acteur_id: data.acteur_id || null,
    }));
    
    // Stocker actor_type séparément pour la redirection
    if (data.actor_type) {
      sessionStorage.setItem('actor_type', data.actor_type);
    }
    // Stocker acteur_id séparément (utilisé par les dashboards)
    if (data.acteur_id) {
      sessionStorage.setItem(this.acteurKey, data.acteur_id);
    }
    sessionStorage.setItem(this.expiryKey, String(expiry));

    return data;
  }

  async register(username: string, password: string, acteur_id: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, acteur_id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    const user = sessionStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem(this.tokenKey);
    if (!token) return false;

    const expiry = sessionStorage.getItem(this.expiryKey);
    if (!expiry) {
      this.logout();
      return false;
    }

    if (Date.now() > Number(expiry)) {
      this.logout();
      return false;
    }

    return true;
  }

  // Renouvelle l'expiration à chaque interaction utilisateur
  refreshExpiry(): void {
    if (sessionStorage.getItem(this.tokenKey)) {
      sessionStorage.setItem(this.expiryKey, String(Date.now() + SESSION_DURATION_MS));
    }
  }

  getSessionTimeRemaining(): number {
    const expiry = sessionStorage.getItem(this.expiryKey);
    if (!expiry) return 0;
    return Math.max(0, Number(expiry) - Date.now());
  }

  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  setUser(user: User): void {
    sessionStorage.setItem(this.userKey, JSON.stringify(user));
  }
}

export default new AuthService();
