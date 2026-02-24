const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Durée de session : 2 heures (en millisecondes)
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  username: string;
  acteur_id: string;
  actor_type?: string;
}

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';
  private acteurKey = 'acteur_id';
  private expiryKey = 'session_expiry';
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel('afor_auth');
    this.channel.onmessage = this.handleMessage.bind(this);

    // Si cet onglet n'a pas de session, demander aux autres onglets ouverts
    if (!sessionStorage.getItem(this.tokenKey)) {
      this.channel.postMessage({ type: 'SESSION_REQUEST' });
    }
  }

  private handleMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    if (type === 'SESSION_REQUEST') {
      // Un autre onglet demande la session — on la partage si on en a une valide
      if (this.isAuthenticated()) {
        this.channel.postMessage({
          type: 'SESSION_RESPONSE',
          data: {
            token: sessionStorage.getItem(this.tokenKey),
            user: sessionStorage.getItem(this.userKey),
            acteur_id: sessionStorage.getItem(this.acteurKey),
            expiry: sessionStorage.getItem(this.expiryKey),
          },
        });
      }
    } else if (type === 'SESSION_RESPONSE') {
      // Un autre onglet a répondu — on adopte sa session si on n'en a pas
      if (!sessionStorage.getItem(this.tokenKey) && data?.token) {
        sessionStorage.setItem(this.tokenKey, data.token);
        if (data.user) sessionStorage.setItem(this.userKey, data.user);
        if (data.acteur_id) sessionStorage.setItem(this.acteurKey, data.acteur_id);
        if (data.expiry) sessionStorage.setItem(this.expiryKey, data.expiry);
        window.dispatchEvent(new Event('session_restored'));
      }
    } else if (type === 'SESSION_LOGOUT') {
      // Un autre onglet s'est déconnecté — on se déconnecte aussi
      this._clearStorage();
      window.dispatchEvent(new Event('session_logout'));
    }
  }

  private _clearStorage(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.acteurKey);
    sessionStorage.removeItem(this.expiryKey);
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
      actor_type: data.actor_type,
    }));
    sessionStorage.setItem(this.expiryKey, String(expiry));
    if (data.acteur_id) {
      sessionStorage.setItem(this.acteurKey, data.acteur_id);
    }

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
    if (!expiry || Date.now() > Number(expiry)) {
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

  logout(): void {
    this._clearStorage();
    // Informer tous les autres onglets ouverts
    this.channel.postMessage({ type: 'SESSION_LOGOUT' });
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
